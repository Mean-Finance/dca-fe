import find from 'lodash/find';
import some from 'lodash/some';
import { Token, YieldOptions, AvailablePairs, PositionVersions, TokenList, TokenListId } from '@types';
import { HUB_ADDRESS, STRING_SWAP_INTERVALS, toReadable } from '@constants';
import { getProtocolToken, getWrappedProtocolToken, PROTOCOL_TOKEN_ADDRESS } from '@common/mocks/tokens';
import { IntlShape } from 'react-intl';
import { AmountsOfToken, Chain, DCAPositionToken } from '@mean-finance/sdk';
import { Chain as WagmiChain } from 'wagmi/chains';
import { formatCurrencyAmount, toToken } from './currency';
import { Address, formatUnits, maxUint256 } from 'viem';
import { TokenBalances } from '@state/balances/hooks';
import { compact } from 'lodash';

export const sortTokensByAddress = (tokenA: string, tokenB: string) => {
  let token0 = tokenA;
  let token1 = tokenB;

  if (tokenA > tokenB) {
    token0 = tokenB;
    token1 = tokenA;
  }

  return [token0 as Address, token1 as Address];
};

export const sortTokens = (tokenA: Token, tokenB: Token) => {
  let token0 = tokenA;
  let token1 = tokenB;

  if (tokenA.address > tokenB.address) {
    token0 = tokenB;
    token1 = tokenA;
  }

  return [token0, token1];
};

export const getSimilarPair = (pairs: AvailablePairs, yieldOptions: YieldOptions, tokenA: Token, tokenB: Token) => {
  const availableYieldOptionsTokenA = yieldOptions.filter((yieldOption) =>
    yieldOption.enabledTokens.includes(tokenA.address)
  );
  const availableYieldOptionsTokenB = yieldOptions.filter((yieldOption) =>
    yieldOption.enabledTokens.includes(tokenB.address)
  );

  const possibleToken0 = [
    ...availableYieldOptionsTokenA.map((yieldOption) => yieldOption.tokenAddress),
    tokenA.address,
  ];
  const possibleToken1 = [
    ...availableYieldOptionsTokenB.map((yieldOption) => yieldOption.tokenAddress),
    tokenB.address,
  ];

  const possiblePairs = possibleToken0.reduce<string[]>((acc, token0) => {
    const newAcc = [...acc];

    possibleToken1.forEach((token1) => {
      const [from, to] = sortTokensByAddress(token0, token1);
      const pair = `${from}-${to}`;
      if (newAcc.indexOf(pair) === -1) {
        newAcc.push(pair);
      }
    });

    return newAcc;
  }, []);

  return some(possiblePairs, (possiblePair) => find(pairs, { id: possiblePair }));
};

export const NO_SWAP_INFORMATION = -1;
export const NOTHING_TO_EXECUTE = 0;
export const HEALTHY = 1;
export const STALE = 2;

export const calculateStaleSwaps = (lastSwapped: number, frequencyType: bigint, createdAt: number) => {
  const today = BigInt(Math.floor(Date.now() / 1000)) / frequencyType;

  if (lastSwapped === 0) {
    return today - (BigInt(createdAt) / frequencyType + 3n);
  }

  const nextSwapAvailable = BigInt(lastSwapped) / frequencyType + 3n;
  return today - nextSwapAvailable;
};

export const getFrequencyLabel = (intl: IntlShape, frenquencyType: string, frequencyValue?: string) =>
  frequencyValue && BigInt(frequencyValue) === 1n
    ? intl.formatMessage(STRING_SWAP_INTERVALS[frenquencyType as keyof typeof STRING_SWAP_INTERVALS].singular)
    : intl.formatMessage(STRING_SWAP_INTERVALS[frenquencyType as keyof typeof STRING_SWAP_INTERVALS].plural, {
        readable: toReadable(parseInt(frequencyValue || '0', 10), Number(frenquencyType), intl),
        left: parseInt(frequencyValue || '0', 10),
      });

export const getTimeFrequencyLabel = (intl: IntlShape, frenquencyType: string, frequencyValue?: string) =>
  frequencyValue && BigInt(frequencyValue) === 1n
    ? intl.formatMessage(STRING_SWAP_INTERVALS[frenquencyType as keyof typeof STRING_SWAP_INTERVALS].singularTime)
    : intl.formatMessage(STRING_SWAP_INTERVALS[frenquencyType as keyof typeof STRING_SWAP_INTERVALS].pluralTime, {
        readable: toReadable(parseInt(frequencyValue || '0', 10), Number(frenquencyType), intl),
        left: parseInt(frequencyValue || '0', 10),
      });

export const capitalizeFirstLetter = (toCap: string) => toCap.charAt(0).toUpperCase() + toCap.slice(1);

export function getURLFromQuery(query: string) {
  if (query.startsWith('https://')) {
    return query;
  }
  if (query.endsWith('.eth')) {
    return `https://${query}.link`;
  }
  return '';
}

export const sdkDcaTokenToToken = (token: DCAPositionToken, chainId: number): Token => {
  const hasYield = token.variant.type === 'yield';
  let newToken = toToken({
    ...token,
    chainId,
    underlyingTokens: [],
  });

  if (hasYield) {
    newToken.underlyingTokens = [
      toToken({
        ...token,
        chainId,
        underlyingTokens: [],
      }),
    ];

    newToken = {
      ...newToken,
      address: token.variant.id as Address,
    };
  }

  return newToken;
};

export const getDisplayToken = (token: Token, chainId?: number) => {
  const chainIdToUse = chainId || token.chainId;
  const protocolToken = getProtocolToken(chainIdToUse);
  const wrappedProtocolToken = getWrappedProtocolToken(chainIdToUse);

  let underlyingToken =
    !!token.underlyingTokens.length &&
    token.underlyingTokens[0].address.toLowerCase() !== PROTOCOL_TOKEN_ADDRESS &&
    token.underlyingTokens[0];

  underlyingToken = underlyingToken && {
    ...underlyingToken,
    chainId: chainIdToUse,
    underlyingTokens: [
      toToken({
        ...token,
        underlyingTokens: [],
      }),
    ],
  };

  if (underlyingToken && underlyingToken.address === wrappedProtocolToken.address) {
    underlyingToken = {
      ...protocolToken,
      chainId: chainIdToUse,
      underlyingTokens: [
        toToken({
          ...token,
          underlyingTokens: [],
        }),
      ],
    };
  }

  const baseToken =
    token.address === wrappedProtocolToken.address ? protocolToken : { ...token, chainId: chainIdToUse };

  return underlyingToken || baseToken;
};

export const calculateYield = (remainingLiquidity: bigint, rate: bigint, remainingSwaps: bigint) => {
  const yieldFromGenerated = remainingLiquidity - rate * remainingSwaps;

  return {
    total: remainingLiquidity,
    yieldGenerated: yieldFromGenerated,
    base: remainingLiquidity - yieldFromGenerated,
  };
};

export const activePositionsPerIntervalToHasToExecute = (
  activePositionsPerInterval: [number, number, number, number, number, number, number, number]
): [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean] =>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  activePositionsPerInterval.map((activePositions) => Number(activePositions) !== 0);

export const findHubAddressVersion = (hubAddress: string) => {
  const versions = Object.entries(HUB_ADDRESS);

  for (const entry of versions) {
    const [positionVersion, chainsAndAddresses] = entry;

    const addresses = Object.values(chainsAndAddresses);

    const isHubInVersion = addresses.filter((address) => address.toLowerCase() === hubAddress.toLowerCase()).length;

    if (isHubInVersion) {
      return positionVersion as PositionVersions;
    }
  }

  throw new Error('hub address not found');
};

export const usdFormatter = (num: number) => {
  const si = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  // eslint-disable-next-line no-plusplus
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(3).replace(rx, '$1') + si[i].symbol;
};

export const chainToWagmiNetwork = ({
  chainId,
  name,
  publicRPCs,
  nativeCurrency,
  testnet,
  explorer,
}: Chain): WagmiChain => ({
  name,
  id: chainId,
  nativeCurrency: {
    ...nativeCurrency,
    decimals: 18,
  },
  network: name,
  /** Collection of RPC endpoints */
  rpcUrls: {
    default: {
      http: publicRPCs,
    },
    public: {
      http: publicRPCs,
    },
  },
  blockExplorers: {
    default: {
      name: 'etherscan',
      url: explorer,
    },
  },
  testnet,
});

export const identifyNetwork = (networks: Chain[], chainId?: string): Chain | undefined => {
  const chainIdParsed = Number(chainId);

  let foundNetwork = find(networks, { chainId: chainIdParsed });
  if (!foundNetwork && chainId) {
    foundNetwork = find(
      networks,
      ({ name, ids }) => name.toLowerCase() === chainId.toLowerCase() || ids.includes(chainId.toLowerCase())
    );
  }
  return foundNetwork;
};

export const validateAddress = (address: string) => {
  const validRegex = RegExp(/^0x[A-Fa-f0-9]{40}$/);
  return validRegex.test(address);
};

export const trimAddress = (address: string, trimSize?: number) =>
  `${address.slice(0, trimSize || 6)}...${address.slice(-(trimSize || 6))}`;

export const formatWalletLabel = (address: string, label?: string, ens?: string | null) => {
  return {
    primaryLabel: label || ens || trimAddress(address || '', 6),
    secondaryLabel: label || ens ? trimAddress(address || '', 4) : undefined,
  };
};

export const totalSupplyThreshold = (decimals = 18) => (maxUint256 - 1n) / 10n ** BigInt(decimals);

export const parseTokensForPicker = ({
  tokenList,
  balances,
  customTokens,
  yieldOptions,
}: {
  yieldOptions?: YieldOptions;
  tokenList: TokenList;
  balances: TokenBalances;
  customTokens?: TokenList;
}) => {
  const tokenKeys = Object.keys(tokenList);
  const customTokenKeys = Object.keys(customTokens || {});

  return compact(
    [...tokenKeys, ...customTokenKeys].map((tokenKey) => {
      const tokenFromList = tokenList[tokenKey as TokenListId];

      if (!tokenFromList) return null;

      const tokenAddress = tokenFromList.address;

      const tokenBalance = balances[tokenAddress];

      const availableYieldOptions = (yieldOptions || []).filter((yieldOption) =>
        yieldOption.enabledTokens.includes(tokenAddress)
      );

      const balance: AmountsOfToken | undefined =
        (tokenBalance &&
          tokenBalance.balance && {
            amount: tokenBalance.balance.toString(),
            amountInUnits: formatCurrencyAmount(tokenBalance.balance, tokenFromList),
            amountInUSD:
              (tokenBalance.balanceUsd &&
                parseFloat(formatUnits(tokenBalance.balanceUsd, tokenFromList.decimals + 18)).toFixed(2)) ||
              undefined,
          }) ||
        undefined;

      return {
        token: tokenFromList,
        balance,
        isCustomToken: !!customTokenKeys.find(
          (customTokenAddress) => tokenFromList.address.toLowerCase() === customTokenAddress.toLowerCase()
        ),
        allowsYield: !!availableYieldOptions.length,
      };
    })
  );
};
