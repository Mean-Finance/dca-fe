import { buildSDK } from '@mean-finance/sdk';
import isNaN from 'lodash/isNaN';
import { BaseProvider } from '@ethersproject/providers';
import { SwapSortOptions, SORT_MOST_PROFIT, GasKeys } from 'config/constants/aggregator';
import { BigNumber } from 'ethers';
import { SwapOption } from 'types';
import ProviderService from './providerService';
import WalletService from './walletService';

export default class SdkService {
  sdk: ReturnType<typeof buildSDK>;

  walletService: WalletService;

  providerService: ProviderService;

  constructor(walletService: WalletService, providerService: ProviderService) {
    this.walletService = walletService;
    this.providerService = providerService;
    this.sdk = buildSDK();
  }

  async resetProvider() {
    const provider = (await this.providerService.getBaseProvider()) as BaseProvider;
    this.sdk = buildSDK({ provider: { source: { type: 'ethers', instance: provider } } });
  }

  async getSwapOption(
    quote: SwapOption,
    takerAddress: string,
    chainId?: number,
    recipient?: string | null,
    slippagePercentage?: number,
    gasSpeed?: GasKeys,
    skipValidation?: boolean
  ) {
    const currentNetwork = await this.walletService.getNetwork();

    const network = chainId || currentNetwork.chainId;

    const isBuyOrder = quote.type === 'buy';

    return this.sdk.quoteService.getQuote(quote.swapper.id, {
      sellToken: quote.sellToken.address,
      buyToken: quote.buyToken.address,
      chainId: network,
      order: isBuyOrder
        ? {
            type: 'buy',
            buyAmount: quote.buyAmount.amount.toString(),
          }
        : {
            type: 'sell',
            sellAmount: quote.sellAmount.amount.toString() || '0',
          },
      takerAddress,
      ...(!isBuyOrder ? { sellAmount: quote.sellAmount.amount.toString() } : {}),
      ...(isBuyOrder ? { buyAmount: quote.buyAmount.amount.toString() } : {}),
      ...(recipient ? { recipient } : {}),
      ...(slippagePercentage && !isNaN(slippagePercentage) ? { slippagePercentage } : { slippagePercentage: 0.1 }),
      ...(gasSpeed ? { gasSpeed } : {}),
      ...(skipValidation ? { skipValidation } : {}),
    });
  }

  async getSwapOptions(
    from: string,
    to: string,
    sellAmount?: BigNumber,
    buyAmount?: BigNumber,
    sortQuotesBy: SwapSortOptions = SORT_MOST_PROFIT,
    recipient?: string | null,
    slippagePercentage?: number,
    gasSpeed?: GasKeys,
    takerAddress?: string,
    skipValidation?: boolean,
    chainId?: number
  ) {
    const currentNetwork = await this.walletService.getNetwork();

    const network = chainId || currentNetwork.chainId;

    let responses;

    if (!takerAddress) {
      responses = await this.sdk.quoteService.estimateAllQuotes(
        {
          sellToken: from,
          buyToken: to,
          chainId: network,
          order: buyAmount
            ? {
                type: 'buy',
                buyAmount: buyAmount.toString(),
              }
            : {
                type: 'sell',
                sellAmount: sellAmount?.toString() || '0',
              },
          ...(sellAmount ? { sellAmount: sellAmount.toString() } : {}),
          ...(buyAmount ? { buyAmount: buyAmount.toString() } : {}),
          ...(recipient ? { recipient } : {}),
          ...(slippagePercentage && !isNaN(slippagePercentage) ? { slippagePercentage } : { slippagePercentage: 0.1 }),
          ...(gasSpeed ? { gasSpeed } : {}),
          ...(skipValidation ? { skipValidation } : {}),
        },
        {
          sort: {
            by: sortQuotesBy,
          },
          ignoredFailed: false,
        }
      );
    } else {
      responses = await this.sdk.quoteService.getAllQuotes(
        {
          sellToken: from,
          buyToken: to,
          chainId: network,
          order: buyAmount
            ? {
                type: 'buy',
                buyAmount: buyAmount.toString(),
              }
            : {
                type: 'sell',
                sellAmount: sellAmount?.toString() || '0',
              },
          takerAddress,
          ...(sellAmount ? { sellAmount: sellAmount.toString() } : {}),
          ...(buyAmount ? { buyAmount: buyAmount.toString() } : {}),
          ...(recipient ? { recipient } : {}),
          ...(slippagePercentage && !isNaN(slippagePercentage) ? { slippagePercentage } : { slippagePercentage: 0.1 }),
          ...(gasSpeed ? { gasSpeed } : {}),
          ...(skipValidation ? { skipValidation } : {}),
        },
        {
          sort: {
            by: sortQuotesBy,
          },
          ignoredFailed: false,
        }
      );
    }

    return responses;
  }
}
