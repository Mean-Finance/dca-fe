/* eslint-disable no-await-in-loop */
import { v4 as uuidv4 } from 'uuid';
import isUndefined from 'lodash/isUndefined';

// MOCKS
import { Address, TransactionRequest } from 'viem';
import {
  SwapOption,
  SwapOptionWithTx,
  Token,
  PositionVersions,
  TransactionReceipt,
  TransactionRequestWithChain,
} from '@types';
import { toToken } from '@common/utils/currency';
import ERC20ABI from '@abis/erc20';
import WRAPPEDABI from '@abis/weth.json';
import { getProtocolToken } from '@common/mocks/tokens';
import { categorizeError, quoteResponseToSwapOption } from '@common/utils/quotes';
import { QuoteResponse } from '@mean-finance/sdk/dist/services/quotes/types';
import { GasKeys, SORT_MOST_PROFIT, SwapSortOptions, TimeoutKey } from '@constants/aggregator';
import { compact } from 'lodash';
import GraphqlService from './graphql';
import ContractService from './contractService';
import WalletService from './walletService';
import ProviderService from './providerService';
import SdkService from './sdkService';
import SafeService from './safeService';
import SimulationService from './simulationService';
import EventService from './eventService';

export default class AggregatorService {
  contractService: ContractService;

  walletService: WalletService;

  sdkService: SdkService;

  apolloClient: Record<PositionVersions, Record<number, GraphqlService>>;

  providerService: ProviderService;

  safeService: SafeService;

  simulationService: SimulationService;

  eventService: EventService;

  constructor(
    walletService: WalletService,
    contractService: ContractService,
    sdkService: SdkService,
    DCASubgraph: Record<PositionVersions, Record<number, GraphqlService>>,
    providerService: ProviderService,
    safeService: SafeService,
    simulationService: SimulationService,
    eventService: EventService
  ) {
    this.contractService = contractService;
    this.walletService = walletService;
    this.sdkService = sdkService;
    this.apolloClient = DCASubgraph;
    this.providerService = providerService;
    this.safeService = safeService;
    this.simulationService = simulationService;
    this.eventService = eventService;
  }

  async addGasLimit(tx: TransactionRequestWithChain): Promise<TransactionRequest> {
    const gasUsed = await this.providerService.estimateGas(tx);

    return {
      ...tx,
      gas: (gasUsed * 130n) / 100n, // 30% more
    };
  }

  async swap(route: SwapOptionWithTx) {
    const transactionToSend = await this.addGasLimit({ ...(route.tx as TransactionRequest), chainId: route.chainId });

    return this.providerService.sendTransaction(transactionToSend);
  }

  async approveAndSwapSafe(route: SwapOptionWithTx) {
    const account = route.tx.from as Address;
    const approveTx = await this.walletService.buildApproveSpecificTokenTx(
      account,
      route.sellToken,
      route.swapper.allowanceTarget as Address,
      BigInt(route.sellAmount.amount)
    );

    return this.safeService.submitMultipleTxs([approveTx, route.tx as TransactionRequest]);
  }

  async getSwapOptions(
    from: Token,
    to: Token,
    sellAmount?: bigint,
    buyAmount?: bigint,
    sorting?: SwapSortOptions,
    transferTo?: string | null,
    slippage?: number,
    gasSpeed?: GasKeys,
    takerAddress?: Address,
    chainId?: number,
    disabledDexes?: string[],
    usePermit2 = false,
    sourceTimeout = TimeoutKey.patient
  ) {
    const currentNetwork = await this.providerService.getNetwork(takerAddress);

    const isOnNetwork = !chainId || currentNetwork.chainId === chainId;
    let shouldValidate = !buyAmount && isOnNetwork;

    const network = chainId || currentNetwork.chainId;
    let hasEnoughForSwap = true;

    if (takerAddress && sellAmount) {
      // const preAllowanceTarget = await this.sdkService.getAllowanceTarget();
      // const allowance = await this.walletService.getSpecificAllowance(from, preAllowanceTarget);

      // if (parseUnits(allowance.allowance, from.decimals)< sellAmount) {
      //   shouldValidate = false;
      // }

      if (shouldValidate) {
        // If user does not have the balance do not validate tx
        const balance = await this.walletService.getBalance({ account: takerAddress, address: from.address });

        if (balance < sellAmount) {
          shouldValidate = false;
          hasEnoughForSwap = false;
        }
      }
    }

    const swapOptionsResponse = await this.sdkService.getSwapOptions({
      from: from.address,
      to: to.address,
      sellAmount,
      buyAmount,
      sortQuotesBy: sorting,
      recipient: transferTo,
      slippagePercentage: slippage,
      gasSpeed,
      takerAddress,
      skipValidation: !shouldValidate,
      chainId: network,
      disabledDexes,
      usePermit2,
      sourceTimeout,
    });

    const validOptions = compact(
      swapOptionsResponse.map((option) => {
        if ('failed' in option) {
          // eslint-disable-next-line no-void
          void this.eventService.trackEvent('Aggregator - Fetching quote error', {
            source: option.source.id,
            sourceTimeout,
            errorType: categorizeError(option.error as string),
          });
          return null;
        }
        // eslint-disable-next-line no-void
        void this.eventService.trackEvent('Aggregator - Fetching quote successfull', {
          source: option.source.id,
          sourceTimeout,
        });
        return option;
      }) as QuoteResponse[]
    );

    const protocolToken = getProtocolToken(network);

    const sellToken = from.address === protocolToken.address ? protocolToken : toToken(from);
    const buyToken = to.address === protocolToken.address ? protocolToken : toToken(to);

    let sortedOptions = validOptions.map<SwapOption>((quoteResponse) => ({
      ...quoteResponseToSwapOption({
        chainId: network,
        ...quoteResponse,
        sellToken: {
          ...quoteResponse.sellToken,
          ...sellToken,
        },
        buyToken: {
          ...quoteResponse.buyToken,
          ...buyToken,
        },
      }),
      transferTo: transferTo as Address,
    }));

    if (usePermit2 && from.address === protocolToken.address && takerAddress && hasEnoughForSwap) {
      sortedOptions = await this.simulationService.simulateQuotes(
        takerAddress,
        sortedOptions,
        sorting || SORT_MOST_PROFIT,
        undefined,
        buyAmount
      );
    }
    return sortedOptions;
  }

  async getSwapOption(
    quote: SwapOption,
    takerAddress: Address,
    transferTo?: string | null,
    slippage?: number,
    gasSpeed?: GasKeys,
    chainId?: number,
    usePermit2?: boolean
  ) {
    const currentNetwork = await this.providerService.getNetwork(takerAddress);

    const isBuyOrder = quote.type === 'buy';

    const isOnNetwork = !chainId || currentNetwork.chainId === chainId;
    let shouldValidate = !isBuyOrder && isOnNetwork;

    const network = chainId || currentNetwork.chainId;

    if (takerAddress && !isBuyOrder) {
      // const preAllowanceTarget = await this.sdkService.getAllowanceTarget();
      // const allowance = await this.walletService.getSpecificAllowance(from, preAllowanceTarget);

      // if (parseUnits(allowance.allowance, from.decimals)< sellAmount) {
      //   shouldValidate = false;
      // }

      if (shouldValidate) {
        // If user does not have the balance do not validate tx
        const balance = await this.walletService.getBalance({
          account: takerAddress,
          address: quote.sellToken.address,
        });

        if (balance < quote.sellAmount.amount) {
          shouldValidate = false;
        }
      }
    }

    const swapOptionResponse = await this.sdkService.getSwapOption(
      quote,
      takerAddress,
      network,
      transferTo,
      slippage,
      gasSpeed,
      !shouldValidate,
      usePermit2
    );

    const { sellToken, buyToken } = quote;

    const {
      sellAmount: {
        amount: sellAmountAmount,
        amountInUnits: sellAmountAmountInUnits,
        amountInUSD: sellAmountAmountInUsd,
      },
      buyAmount: { amount: buyAmountAmount, amountInUnits: buyAmountAmountInUnits, amountInUSD: buyAmountAmountInUsd },
      maxSellAmount: {
        amount: maxSellAmountAmount,
        amountInUnits: maxSellAmountAmountInUnits,
        amountInUSD: maxSellAmountAmountInUsd,
      },
      minBuyAmount: {
        amount: minBuyAmountAmount,
        amountInUnits: minBuyAmountAmountInUnits,
        amountInUSD: minBuyAmountAmountInUsd,
      },
      gas,
      source: { allowanceTarget, logoURI, name, id },
      type,
      tx,
    } = swapOptionResponse;

    return {
      id: uuidv4(),
      sellToken,
      buyToken,
      transferTo: transferTo as Address,
      chainId: network,
      sellAmount: {
        amount: BigInt(sellAmountAmount),
        amountInUnits: sellAmountAmountInUnits,
        amountInUSD: Number(sellAmountAmountInUsd) || 0,
      },
      buyAmount: {
        amount: BigInt(buyAmountAmount),
        amountInUnits: buyAmountAmountInUnits,
        amountInUSD: Number(buyAmountAmountInUsd) || 0,
      },
      maxSellAmount: {
        amount: BigInt(maxSellAmountAmount),
        amountInUnits: maxSellAmountAmountInUnits,
        amountInUSD: Number(maxSellAmountAmountInUsd) || 0,
      },
      minBuyAmount: {
        amount: BigInt(minBuyAmountAmount),
        amountInUnits: minBuyAmountAmountInUnits,
        amountInUSD: Number(minBuyAmountAmountInUsd) || 0,
      },
      gas: gas && {
        estimatedGas: BigInt(gas.estimatedGas),
        estimatedCost: BigInt(gas.estimatedCost),
        estimatedCostInUnits: gas.estimatedCostInUnits,
        estimatedCostInUSD: (!isUndefined(gas.estimatedCostInUSD) && Number(gas.estimatedCostInUSD)) || undefined,
        gasTokenSymbol: gas.gasTokenSymbol,
      },
      swapper: {
        allowanceTarget,
        name,
        logoURI,
        id,
      },
      type,
      tx,
    };
  }

  findTransferValue(
    txReceipt: TransactionReceipt,
    tokenAddress: string,
    {
      from,
      notFrom,
      to,
      notTo,
    }: {
      from?: { address: string };
      notFrom?: { address: string };
      to?: { address: string };
      notTo?: { address: string }[];
    }
  ) {
    // TODO: RE-enable after viem migration
    // const logs = this.findLogs(
    //   txReceipt,
    //   new Interface(ERC20ABI),
    //   'Transfer',
    //   (log) =>
    //     (!from || log.args.from === from.address) &&
    //     (!to || log.args.to === to.address) &&
    //     (!notFrom || log.args.from !== notFrom.address) &&
    //     (!notTo || !notTo.some(({ address }) => address === log.args.to)),
    //   tokenAddress
    // );
    // const wrappedWithdrawLogs = this.findLogs(
    //   txReceipt,
    //   new Interface(WRAPPEDABI),
    //   'Withdrawal',
    //   (log) =>
    //     (!to || log.args.dst === to.address) && (!notTo || !notTo.some(({ address }) => address === log.args.dst)),
    //   tokenAddress
    // );
    // const wrappedDepositLogs = this.findLogs(
    //   txReceipt,
    //   new Interface(WRAPPEDABI),
    //   'Deposit',
    //   (log) =>
    //     (!to || log.args.dst === to.address) && (!notTo || !notTo.some(({ address }) => address === log.args.dst)),
    //   tokenAddress
    // );

    // const fullLogs = [...logs, ...wrappedDepositLogs, ...wrappedWithdrawLogs];

    // // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    // return fullLogs.map((log) => BigInt(log.args.value || log.args.wad || 0));

    return [];
  }

  // findLogs(
  //   txReceipt: TransactionReceipt,
  //   contractInterface: utils.Interface,
  //   eventTopic: string,
  //   extraFilter?: (_: utils.LogDescription) => boolean,
  //   byAddress?: string
  // ): utils.LogDescription[] {
  //   const result: utils.LogDescription[] = [];
  //   const { logs } = txReceipt;
  //   // eslint-disable-next-line no-plusplus
  //   for (let i = 0; i < logs.length; i++) {
  //     // eslint-disable-next-line no-plusplus
  //     for (let x = 0; x < logs[i].topics.length; x++) {
  //       if (
  //         (!byAddress || logs[i].address.toLowerCase() === byAddress.toLowerCase()) &&
  //         logs[i].topics[x] === contractInterface.getEventTopic(eventTopic)
  //       ) {
  //         const parsedLog = contractInterface.parseLog(logs[i]);
  //         if (!extraFilter || extraFilter(parsedLog)) {
  //           result.push(parsedLog);
  //         }
  //       }
  //     }
  //   }
  //   return result;
  // }
}

/* eslint-enable no-await-in-loop */
