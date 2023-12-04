import { ChainId, CurrentPriceForChainResponse, Token, TokenList } from '@types';
import { BalancesState, TokenBalancesAndPrices } from './reducer';
import { createAppAsyncThunk } from '@state';
import { BigNumber } from 'ethers';
import { NETWORKS } from '@constants';
import { flatten, keyBy, set } from 'lodash';
import { PROTOCOL_TOKEN_ADDRESS, getProtocolToken } from '@common/mocks/tokens';

export const fetchWalletBalancesForChain = createAppAsyncThunk<
  { chainId: number; tokenBalances: TokenBalancesAndPrices },
  { tokenList: TokenList; chainId: number; walletAddress: string }
>('balances/fetchWalletBalancesForChain', async ({ tokenList, chainId, walletAddress }, { extra: { web3Service } }) => {
  const sdkService = web3Service.getSdkService();
  const tokens = Object.values(tokenList);

  const balances = await sdkService.getMultipleBalances(tokens, walletAddress);

  const tokenBalances = Object.entries(balances[chainId]).reduce((acc, [tokenAddress, balance]) => {
    if (balance.gt(0)) {
      return {
        ...acc,
        [tokenAddress]: {
          token: tokenList[tokenAddress],
          balances: {
            [walletAddress]: balance,
          },
        },
      };
    }
    return acc;
  }, {} as TokenBalancesAndPrices);

  return { chainId, tokenBalances };
});

export const fetchPricesForChain = createAppAsyncThunk<
  { chainId: number; prices: CurrentPriceForChainResponse },
  { chainId: number }
>('prices/fetchPricesForChain', async ({ chainId }, { extra: { web3Service }, getState }) => {
  const sdkService = web3Service.getSdkService();
  const state = getState();
  const storedTokenAddresses = Object.values(state.balances[chainId].balancesAndPrices || {}).map(
    (tokenBalance) => tokenBalance.token.address
  );
  let priceResponse: CurrentPriceForChainResponse = {};
  if (!!storedTokenAddresses.length) {
    priceResponse = await sdkService.sdk.priceService.getCurrentPricesForChain({
      chainId,
      addresses: storedTokenAddresses,
    });
  }

  return { chainId, prices: priceResponse };
});

export const fetchPricesForAllChains = createAppAsyncThunk<void, void>(
  'balances/fetchInitialBalances',
  (_, { getState, dispatch }) => {
    const state = getState();
    const chainsWithBalance = Object.keys(state.balances);

    const pricePromises = chainsWithBalance.map((chainId) =>
      dispatch(fetchPricesForChain({ chainId: Number(chainId) }))
    );
    void Promise.all(pricePromises);
  }
);

export const fetchInitialBalances = createAppAsyncThunk<Omit<BalancesState, 'isLoadingAllBalances'>, void>(
  'balances/fetchInitialBalances',
  async (_, { extra: { web3Service }, getState }) => {
    const accountService = web3Service.getAccountService();
    const meanApiService = web3Service.getMeanApiService();
    const chainIds = Object.values(NETWORKS).map((network) => network.chainId);
    const wallets = accountService.getWallets().map((wallet) => wallet.address);
    const state = getState();
    const allTokens = flatten(Object.values(state.tokenLists.byUrl).map((list) => list.tokens));

    const tokenListByChainId = allTokens.reduce(
      (acc, token) => {
        return {
          ...acc,
          [token.chainId]: {
            ...acc[token.chainId],
            [token.address]: token,
          },
        };
      },
      {} as Record<ChainId, TokenList>
    );

    const accountBalancesResponse = await meanApiService.getAccountBalances({
      wallets,
      chainIds,
    });

    const parsedAccountBalances = wallets.reduce(
      (acc, walletAddress) => {
        const newAcc = { ...acc };
        Object.entries(accountBalancesResponse.balances[walletAddress]).forEach(([chainId, balances]) => {
          const chainIdNumber = Number(chainId);
          Object.entries(balances).forEach(([tokenAddress, balance]) => {
            let token: Token;
            if (tokenAddress === PROTOCOL_TOKEN_ADDRESS) {
              token = getProtocolToken(chainIdNumber);
            } else {
              token = tokenListByChainId[chainIdNumber][tokenAddress];
            }
            set(
              newAcc,
              [chainIdNumber, 'balancesAndPrices', tokenAddress, 'balances', walletAddress],
              BigNumber.from(balance)
            );
            set(newAcc, [chainIdNumber, 'balancesAndPrices', tokenAddress, 'token'], token);
          });
        });
        return newAcc;
      },
      {} as Omit<BalancesState, 'isLoadingAllBalances'>
    );
    return parsedAccountBalances;
  }
);

export const updateTokens = createAppAsyncThunk<void, { tokens: Token[]; chainId: number; walletAddress: string }>(
  'balances/updateTokens',
  async ({ tokens, chainId, walletAddress }, { dispatch }) => {
    tokens.forEach((token) => {
      if (token.chainId !== chainId) {
        throw new Error('All tokens must belong to the same network');
      }
    });
    const tokenList = keyBy(tokens, 'address');

    await dispatch(fetchWalletBalancesForChain({ chainId, tokenList, walletAddress }));
    await dispatch(fetchPricesForChain({ chainId }));
  }
);
