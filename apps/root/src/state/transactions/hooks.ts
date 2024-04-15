import { useCallback, useMemo } from 'react';
import reduce from 'lodash/reduce';
import find from 'lodash/find';
import {
  TransactionDetails,
  TransactionTypes,
  Token,
  TransactionAdderCustomData,
  SubmittedTransaction,
  TransactionsHistory,
} from '@types';
import { useAppDispatch, useAppSelector } from '@hooks/state';
import useCurrentNetwork from '@hooks/useCurrentNetwork';

import { COMPANION_ADDRESS, DCA_TYPE_TRANSACTIONS, HUB_ADDRESS, LATEST_VERSION } from '@constants';
import pickBy from 'lodash/pickBy';
import usePositionService from '@hooks/usePositionService';
import useArcx from '@hooks/useArcx';
import { addTransaction } from './actions';
import useWallets from '@hooks/useWallets';
import { getWalletsAddresses } from '@common/utils/accounts';
import { Address } from 'viem';
import useDcaIndexingBlocks from '@hooks/useDcaIndexingBlocks';
import { isUndefined, map, orderBy } from 'lodash';

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: SubmittedTransaction,
  customData: TransactionAdderCustomData
) => void {
  const positionService = usePositionService();
  const dispatch = useAppDispatch();
  const currentNetwork = useCurrentNetwork();
  const arcxClient = useArcx();

  return useCallback(
    (response: SubmittedTransaction, customData: TransactionAdderCustomData) => {
      const { hash, from } = response;
      if (!hash) {
        throw Error('No transaction hash found.');
      }
      dispatch(
        addTransaction({
          hash,
          from,
          chainId: response.chainId,
          ...customData,
          position: customData.position && { ...customData.position },
        })
      );
      try {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        arcxClient.transaction({
          chainId: response.chainId,
          transactionHash: hash,
          metadata: {
            type: customData.type,
            position: customData.position && customData.position.positionId,
          },
        });
      } catch (e) {
        console.error('Error sending transaction event to arcx');
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      positionService.setPendingTransaction({
        hash,
        from,
        chainId: response.chainId,
        addedTime: new Date().getTime(),
        retries: 0,
        checking: false,
        ...customData,
        position: customData.position && { ...customData.position },
      });
    },
    [dispatch, currentNetwork]
  );
}

export function useTransaction(txHash?: string) {
  const state = useAppSelector((appState) => appState.transactions);
  const currentNetwork = useCurrentNetwork();

  if (!txHash || !state[currentNetwork.chainId]) {
    return null;
  }

  return state[currentNetwork.chainId][txHash];
}

// returns all the transactions
export function useTransactions(): TransactionDetails[] {
  const state = useAppSelector((appState) => appState.transactions);
  const wallets = useWallets();
  const returnValue = useMemo(
    () =>
      Object.keys(state).reduce<TransactionDetails[]>((acc, stateKey) => {
        acc.push(
          ...Object.values(state[Number(stateKey)]).filter((tx) =>
            wallets.find((wallet) => wallet.address.toLowerCase() === tx.from.toLowerCase())
          )
        );
        return acc;
      }, []),
    // pickBy(state[currentNetwork.chainId], (tx: TransactionDetails) =>
    //   wallets.find((wallet) => wallet.address.toLowerCase() === tx.from.toLowerCase())
    // ),
    [state, wallets]
  );
  return returnValue;
}

// returns all the transactions that are not cleared
export function useAllNotClearedTransactions(): { [txHash: string]: TransactionDetails } {
  const state = useAppSelector((appState) => appState.transactions);
  const wallets = useWallets();

  const mappedWallets = getWalletsAddresses(wallets);

  const mergedState = useMemo(
    () =>
      Object.keys(state).reduce<Record<string, TransactionDetails>>(
        (acc, value) => ({
          ...acc,
          ...state[Number(value)],
        }),
        {}
      ),
    [mappedWallets, Object.keys(state)]
  );

  const returnValue = useMemo(
    () =>
      pickBy(
        mergedState,
        (tx: TransactionDetails) => mappedWallets.includes(tx.from.toLowerCase()) && tx.isCleared === false
      ),
    [Object.keys(mergedState || {}), mappedWallets]
  );
  return returnValue || {};
}

export function useIsTransactionPending(): (transactionHash?: string) => boolean {
  const transactions = useTransactions();

  return useCallback(
    (transactionHash?: string) => {
      const tx = transactions.find(({ hash }) => hash.toLowerCase() === transactionHash?.toLowerCase());
      if (!tx) return false;
      return !tx.receipt;
    },
    [transactions]
  );
}

export function useHasPendingTransactions(): boolean {
  const transactions = useAllNotClearedTransactions();

  return useMemo(() => Object.keys(transactions).some((hash) => !transactions[hash].receipt), [transactions]);
}

export function usePendingTransactions(): TransactionDetails[] {
  const transactions = useTransactions();

  return useMemo(
    () =>
      reduce(
        transactions,
        (acc: TransactionDetails[], tx) => {
          if (!tx?.receipt) {
            acc.push(tx);
          }

          return acc;
        },
        []
      ),
    [transactions]
  );
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000;
}

export function isTransactionPending(tx: TransactionDetails): boolean {
  return !tx.receipt;
}

// returns whether a token has a pending approval transaction
export function useHasPendingApproval(
  token: Token | null,
  spender: string | undefined,
  checkForCompanion = false,
  addressToCheckOverride?: string
): boolean {
  const allTransactions = useTransactions();
  const tokenAddress = (token && token.address) || '';
  const currentNetwork = useCurrentNetwork();
  const dcaContract = checkForCompanion
    ? COMPANION_ADDRESS[LATEST_VERSION][currentNetwork.chainId]
    : HUB_ADDRESS[LATEST_VERSION][currentNetwork.chainId];
  const addressToCheck = addressToCheckOverride || dcaContract;

  return useMemo(
    () =>
      !!token &&
      typeof tokenAddress === 'string' &&
      typeof spender === 'string' &&
      allTransactions.some((tx) => {
        if (tx.type !== TransactionTypes.approveToken && tx.type !== TransactionTypes.approveTokenExact) return false;

        if (tx.receipt) {
          return false;
        }

        return (
          tx.typeData.token.address === tokenAddress &&
          tx.typeData.addressFor === addressToCheck &&
          tx.from.toLowerCase() === spender.toLowerCase()
        );
      }),
    [allTransactions, spender, tokenAddress, addressToCheck]
  );
}

// returns whether a token has a pending transaction
export function usePositionHasPendingTransaction(position: string, chainId: number): string | null {
  const allTransactions = useTransactions();

  return useMemo(() => {
    const foundTransaction = find(allTransactions, (transaction) => {
      if (
        transaction.type === TransactionTypes.newPair ||
        transaction.type === TransactionTypes.approveToken ||
        transaction.type === TransactionTypes.approveTokenExact ||
        transaction.type === TransactionTypes.swap ||
        transaction.type === TransactionTypes.wrap ||
        transaction.type === TransactionTypes.unwrap ||
        transaction.type === TransactionTypes.wrapEther ||
        transaction.type === TransactionTypes.transferToken
      )
        return false;
      if (transaction.receipt) {
        return false;
      }
      return transaction.typeData.id === position && chainId === transaction.chainId;
    });

    return foundTransaction?.hash || null;
  }, [allTransactions, position]);
}
// return wether a campaign is waiting for the claim
export function useCampaignHasPendingTransaction(campaignId: string): boolean {
  const allTransactions = useTransactions();

  return useMemo(
    () =>
      allTransactions.some((tx) => {
        if (!tx) return false;
        if (tx.type !== TransactionTypes.claimCampaign) return false;
        if (tx.receipt) {
          return false;
        }
        return tx.typeData.id === campaignId && !tx.receipt;
      }),
    [allTransactions, campaignId]
  );
}
// return wether a campaign is waiting for the claim
export function useCampaignHasConfirmedTransaction(campaignId: string): boolean {
  const allTransactions = useTransactions();

  return useMemo(
    () =>
      allTransactions.some((tx) => {
        if (!tx) return false;
        if (tx.type !== TransactionTypes.claimCampaign) return false;
        if (tx.receipt) {
          return false;
        }
        return tx.typeData.id === campaignId && tx.receipt;
      }),
    [allTransactions, campaignId]
  );
}

export function useTransactionsAfterBlockNumber(accountBlockNumbers?: TransactionsHistory['indexing']) {
  const state = useAppSelector((appState) => appState.transactions);
  const dcaIndexingBlocks = useDcaIndexingBlocks();
  const wallets = useWallets();

  const transactions = useMemo<TransactionDetails[]>(() => {
    if (!accountBlockNumbers || Object.keys(accountBlockNumbers).length === 0) return [];
    const chains = Object.keys(state);

    const unsortedTxs = chains.reduce<TransactionDetails[]>((acc, chainIdString) => {
      const chainId = Number(chainIdString);

      const filteredTransactions = Object.values(state[chainId]).filter((transaction) => {
        if (!map(wallets, 'address').includes(transaction.from as Address)) {
          return false;
        }

        if (!transaction.receipt) {
          return true;
        }

        if (DCA_TYPE_TRANSACTIONS.includes(transaction.type)) {
          return (
            dcaIndexingBlocks[chainId] &&
            transaction.receipt.blockNumber > BigInt(dcaIndexingBlocks[chainId].processedUpTo)
          );
        } else {
          return (
            accountBlockNumbers[transaction.from as Address] &&
            accountBlockNumbers[transaction.from as Address][chainId] &&
            !isUndefined(accountBlockNumbers[transaction.from as Address][chainId].processedUpTo) &&
            transaction.receipt.blockNumber >
              BigInt(accountBlockNumbers[transaction.from as Address][chainId].processedUpTo)
          );
        }
      });

      acc.push(...filteredTransactions);

      return acc;
    }, []);

    return orderBy(unsortedTxs, [(tx) => !!tx.receipt, (tx) => tx.confirmedTime], ['asc', 'desc']);
  }, [accountBlockNumbers, state, dcaIndexingBlocks, wallets]);

  return transactions;
}
