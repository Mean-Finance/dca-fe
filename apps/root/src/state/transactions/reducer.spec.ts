import reducer, { TransactionState } from './reducer';
import { cleanTransactions } from './actions';
import { TransactionApiIndexing, TransactionDetails, TransactionReceipt, TransactionTypes } from 'common-types';
import { isUndefined } from 'lodash';

const generateTransactionReceipt = ({
  blockHash,
  blockNumber,
  contractAddress,
  cumulativeGasUsed,
  effectiveGasPrice,
  from,
  gasUsed,
  logs,
  logsBloom,
  status,
  to,
  transactionHash,
  transactionIndex,
  type,
  chainId,
}: Partial<TransactionReceipt>): TransactionReceipt => ({
  blockHash: isUndefined(blockHash) ? '0xblockhash' : blockHash,
  blockNumber: isUndefined(blockNumber) ? 11n : blockNumber,
  contractAddress: isUndefined(contractAddress) ? '0xcontractAddress' : contractAddress,
  cumulativeGasUsed: isUndefined(cumulativeGasUsed) ? 10n : cumulativeGasUsed,
  effectiveGasPrice: isUndefined(effectiveGasPrice) ? 10n : effectiveGasPrice,
  from: isUndefined(from) ? '0xfrom' : from,
  gasUsed: isUndefined(gasUsed) ? 10n : gasUsed,
  logs: isUndefined(logs) ? [] : logs,
  logsBloom: isUndefined(logsBloom) ? '0xlogsbloom' : logsBloom,
  status: isUndefined(status) ? 'success' : status,
  to: isUndefined(to) ? '0xto' : to,
  transactionHash: isUndefined(transactionHash) ? '0xtransactionHash' : transactionHash,
  transactionIndex: isUndefined(transactionIndex) ? 1 : transactionIndex,
  type: isUndefined(type) ? '0x2' : type,
  chainId: isUndefined(chainId) ? 1 : chainId,
});

const generateTransactionDetails = ({
  hash,
  isCleared,
  approval,
  summary,
  claim,
  retries,
  receipt,
  chainId,
  lastCheckedBlockNumber,
  addedTime,
  confirmedTime,
  from,
  position,
  realSafeHash,
  checking,
  type,
  typeData,
}: Partial<TransactionDetails>): TransactionDetails =>
  ({
    hash: isUndefined(hash) ? '0xhash' : hash,
    isCleared: isUndefined(isCleared) ? false : isCleared,
    approval,
    summary: isUndefined(summary) ? 'summary' : summary,
    claim,
    retries: isUndefined(retries) ? 0 : retries,
    receipt,
    chainId: isUndefined(chainId) ? 1 : chainId,
    lastCheckedBlockNumber: isUndefined(lastCheckedBlockNumber) ? 10 : lastCheckedBlockNumber,
    addedTime: isUndefined(addedTime) ? Date.now() - 10 : addedTime,
    confirmedTime: isUndefined(confirmedTime) ? Date.now() : confirmedTime,
    from: isUndefined(from) ? '0xfrom' : from,
    position,
    realSafeHash,
    checking: isUndefined(checking) ? false : checking,
    type: isUndefined(type) ? TransactionTypes.noOp : type,
    typeData: isUndefined(typeData) ? { id: 'id' } : typeData,
  }) as TransactionDetails;

describe('Transactions reducer', () => {
  describe('cleanTransactions', () => {
    test('should return the initial state', () => {
      expect(reducer(undefined, { type: undefined })).toEqual({});
    });

    test('should keep all user transactions that are pending', () => {
      const previousState: TransactionState = {
        1: {
          '0xtx1': generateTransactionDetails({
            hash: '0xtx1',
            chainId: 1,
          }),
          '0xtx2': generateTransactionDetails({
            hash: '0xtx2',
            chainId: 1,
          }),
        },
        2: {
          '0xtx3': generateTransactionDetails({
            hash: '0xtx3',
            chainId: 2,
          }),
        },
      };

      const indexing: TransactionApiIndexing = {
        '0xfrom': {
          1: {
            processedUpTo: '10',
            target: '10',
            detectedUpTo: '10',
          },
          2: {
            processedUpTo: '10',
            target: '10',
            detectedUpTo: '10',
          },
        },
      };

      expect(reducer(previousState, cleanTransactions({ indexing }))).toEqual(previousState);
    });

    test('should remove all user transactions that before the last indexed block', () => {
      const previousState: TransactionState = {
        1: {
          '0xtx1': generateTransactionDetails({
            hash: '0xtx1',
            chainId: 1,
            receipt: generateTransactionReceipt({ blockNumber: 11n }),
          }),
          '0xtx2': generateTransactionDetails({
            hash: '0xtx2',
            chainId: 1,
            receipt: generateTransactionReceipt({ blockNumber: 10n }),
          }),
        },
        2: {
          '0xtx3': generateTransactionDetails({
            hash: '0xtx3',
            chainId: 2,
            receipt: generateTransactionReceipt({ blockNumber: 9n }),
          }),
        },
      };

      const expectedState: TransactionState = {
        1: {
          '0xtx1': generateTransactionDetails({
            hash: '0xtx1',
            chainId: 1,
            receipt: generateTransactionReceipt({ blockNumber: 11n }),
          }),
        },
        2: {},
      };

      const indexing: TransactionApiIndexing = {
        '0xfrom': {
          1: {
            processedUpTo: '11',
            target: '11',
            detectedUpTo: '11',
          },
          2: {
            processedUpTo: '10',
            target: '10',
            detectedUpTo: '10',
          },
        },
      };

      expect(reducer(previousState, cleanTransactions({ indexing }))).toEqual(expectedState);
    });

    test('should do nothing for transactions that are on a chain that is not handled by the indexer', () => {
      const previousState: TransactionState = {
        1: {
          '0xtx1': generateTransactionDetails({
            hash: '0xtx1',
            chainId: 1,
            receipt: generateTransactionReceipt({ blockNumber: 11n }),
          }),
          '0xtx2': generateTransactionDetails({
            hash: '0xtx2',
            chainId: 1,
            receipt: generateTransactionReceipt({ blockNumber: 10n }),
          }),
        },
        5: {
          '0xtx3': generateTransactionDetails({
            hash: '0xtx3',
            chainId: 2,
            receipt: generateTransactionReceipt({ blockNumber: 9n }),
          }),
        },
      };

      const expectedState: TransactionState = {
        1: {
          '0xtx1': generateTransactionDetails({
            hash: '0xtx1',
            chainId: 1,
            receipt: generateTransactionReceipt({ blockNumber: 11n }),
          }),
        },
        5: {
          '0xtx3': generateTransactionDetails({
            hash: '0xtx3',
            chainId: 2,
            receipt: generateTransactionReceipt({ blockNumber: 9n }),
          }),
        },
      };

      const indexing: TransactionApiIndexing = {
        '0xfrom': {
          1: {
            processedUpTo: '11',
            target: '11',
            detectedUpTo: '11',
          },
          2: {
            processedUpTo: '10',
            target: '10',
            detectedUpTo: '10',
          },
        },
        '0xto': {
          1: {
            processedUpTo: '11000',
            target: '11000',
            detectedUpTo: '11000',
          },
          2: {
            processedUpTo: '10000',
            target: '10000',
            detectedUpTo: '10000',
          },
        },
      };

      expect(reducer(previousState, cleanTransactions({ indexing }))).toEqual(expectedState);
    });
  });
});
