import { createAction } from '@reduxjs/toolkit';
import {
  TransactionReceipt,
  TransactionTypeDataOptions,
  TransactionAdderPayload,
  TransactionApiIndexing,
} from '@types';

export const addTransaction = createAction<TransactionAdderPayload>('transactions/addTransaction');
export const finalizeTransaction = createAction<{
  hash: string;
  receipt: TransactionReceipt;
  extendedTypeData: TransactionTypeDataOptions | Record<string, never>;
  chainId: number;
  realSafeHash?: string;
}>('transactions/finalizeTransaction');
export const setTransactionsChecking = createAction<{ chainId: number; hash: string }[]>(
  'transactions/setTransactionsChecking'
);
export const checkedTransaction = createAction<{
  hash: string;
  chainId: number;
}>('transactions/checkedTransaction');
export const checkedTransactionExist = createAction<{
  hash: string;
  blockNumber?: number;
  chainId: number;
}>('transactions/checkedTransactionExist');
export const transactionFailed = createAction<{
  hash: string;
  blockNumber?: number;
  chainId: number;
}>('transactions/transactionFailed');
export const removeTransaction = createAction<{
  hash: string;
  chainId: number;
}>('transactions/removeTransaction');
export const clearAllTransactions = createAction<{
  chainId: number;
}>('transactions/clearAllTransactions');

export const cleanTransactions = createAction<{
  indexing: TransactionApiIndexing;
}>('transactions/cleanTransactions');
