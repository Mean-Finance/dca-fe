import ContractService from './contractService';
import ProviderService from './providerService';
import SdkService from './sdkService';
import MeanApiService from './meanApiService';
import AccountService from './accountService';
import { TransactionEvent, TransactionsHistoryResponse } from '@types';
import { sortedLastIndexBy } from 'lodash';
import { Address, DecodeEventLogReturnType, Log, WatchBlockNumberReturnType, decodeEventLog } from 'viem';

export default class TransactionService {
  contractService: ContractService;

  providerService: ProviderService;

  loadedAsSafeApp: boolean;

  sdkService: SdkService;

  meanApiService: MeanApiService;

  accountService: AccountService;

  transactionsHistory: { isLoading: boolean; history?: TransactionsHistoryResponse } = { isLoading: true };

  onBlockCallbacks: Record<number, WatchBlockNumberReturnType>;

  constructor(
    contractService: ContractService,
    providerService: ProviderService,
    sdkService: SdkService,
    meanApiService: MeanApiService,
    accountService: AccountService
  ) {
    this.loadedAsSafeApp = false;
    this.providerService = providerService;
    this.contractService = contractService;
    this.sdkService = sdkService;
    this.meanApiService = meanApiService;
    this.accountService = accountService;
    this.onBlockCallbacks = {};
  }

  getLoadedAsSafeApp() {
    return this.loadedAsSafeApp;
  }

  setLoadedAsSafeApp(loadedAsSafeApp: boolean) {
    this.loadedAsSafeApp = loadedAsSafeApp;
  }

  getStoredTransactionsHistory() {
    return this.transactionsHistory;
  }

  // TRANSACTION HANDLING
  getTransactionReceipt(txHash: Address, chainId: number) {
    return this.sdkService.getTransactionReceipt(txHash, chainId);
  }

  getTransaction(txHash: Address, chainId: number) {
    return this.sdkService.getTransaction(txHash, chainId);
  }

  waitForTransaction(txHash: Address, chainId: number) {
    return this.providerService.waitForTransaction(txHash, chainId);
  }

  onBlock(chainId: number, callback: (blockNumber: bigint) => void) {
    if (this.loadedAsSafeApp) {
      return window.setInterval(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        () => (callback as unknown as (blockNumber: Promise<bigint>) => Promise<void>)(this.getBlockNumber(chainId)),
        10000
      );
    }

    this.onBlockCallbacks[chainId] = this.providerService.onBlock(chainId, callback);
  }

  removeOnBlock(chainId: number) {
    const listenerRemover = this.onBlockCallbacks[chainId];

    if (listenerRemover) {
      listenerRemover();
    }
  }

  async getBlockNumber(chainId: number) {
    const blockNumber = await this.providerService.getBlockNumber(chainId);
    return blockNumber || Promise.reject(new Error('No provider'));
  }

  async parseLog({
    logs,
    chainId,
    eventToSearch,
  }: {
    logs: Log[];
    chainId: number;
    eventToSearch: string;
    ownerAddress: Address;
  }) {
    const hubAddress = this.contractService.getHUBAddress(chainId);

    const hubInstance = await this.contractService.getHubInstance({ chainId, readOnly: true });

    const hubCompanionInstance = await this.contractService.getHUBCompanionInstance({ chainId, readOnly: true });

    const hubCompanionAddress = this.contractService.getHUBCompanionAddress(chainId);

    const parsedLogs: DecodeEventLogReturnType[] = [];

    logs.forEach((log) => {
      try {
        let parsedLog;

        if (log.address === hubCompanionAddress) {
          parsedLog = decodeEventLog({
            ...hubCompanionInstance,
            topics: log.topics,
          });
        } else if (log.address === hubAddress) {
          parsedLog = decodeEventLog({
            ...hubInstance,
            topics: log.topics,
          });
        }

        if (parsedLog && parsedLog.eventName === eventToSearch) {
          parsedLogs.push(parsedLog);
        }
      } catch (e) {
        console.error(e);
      }
    });

    return parsedLogs[0];
  }

  async fetchTransactionsHistory(beforeTimestamp?: number): Promise<void> {
    const user = this.accountService.getUser();
    try {
      if (!user) {
        throw new Error('User is not connected');
      }

      this.transactionsHistory.isLoading = true;
      const signature = await this.accountService.getWalletVerifyingSignature({});
      const transactionsHistoryResponse = await this.meanApiService.getAccountTransactionsHistory({
        accountId: user.id,
        signature,
        beforeTimestamp,
      });

      if (beforeTimestamp && this.transactionsHistory.history) {
        const insertionIndex = sortedLastIndexBy(
          this.transactionsHistory.history.events,
          { timestamp: beforeTimestamp } as TransactionEvent,
          (ev) => -ev.timestamp
        );

        this.transactionsHistory.history = {
          ...transactionsHistoryResponse,
          events: [
            ...this.transactionsHistory.history.events.slice(0, insertionIndex),
            ...transactionsHistoryResponse.events,
          ],
        };
      } else {
        this.transactionsHistory.history = transactionsHistoryResponse;
      }
    } catch (e) {
      console.error(e);
    }
    this.transactionsHistory.isLoading = false;
  }
}
