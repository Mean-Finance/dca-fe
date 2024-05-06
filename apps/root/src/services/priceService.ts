import findKey from 'lodash/findKey';
import { Address } from 'viem';
import { AxiosInstance, AxiosResponse } from 'axios';
import { Token } from '@types';

// MOCKS
import { PROTOCOL_TOKEN_ADDRESS, getWrappedProtocolToken } from '@common/mocks/tokens';
import {
  DEFILLAMA_IDS,
  DEFILLAMA_PROTOCOL_TOKEN_ADDRESS,
  INDEX_TO_PERIOD,
  INDEX_TO_SPAN,
  NETWORKS,
  STABLE_COINS,
  ZRX_API_ADDRESS,
  getTokenAddressForPriceFetching,
} from '@constants';
import { DateTime } from 'luxon';
import ContractService from './contractService';
import WalletService from './walletService';
import ProviderService from './providerService';
import SdkService from './sdkService';
import { parseNumberUsdPriceToBigInt } from '@common/utils/currency';

interface TokenWithBase extends Token {
  isBaseToken: boolean;
}

type GraphToken = TokenWithBase;

export default class PriceService {
  axiosClient: AxiosInstance;

  walletService: WalletService;

  contractService: ContractService;

  providerService: ProviderService;

  sdkService: SdkService;

  constructor(
    walletService: WalletService,
    contractService: ContractService,
    axiosClient: AxiosInstance,
    providerService: ProviderService,
    sdkService: SdkService
  ) {
    this.walletService = walletService;
    this.axiosClient = axiosClient;
    this.contractService = contractService;
    this.providerService = providerService;
    this.sdkService = sdkService;
  }

  // TOKEN METHODS
  async getUsdHistoricPrice(tokens: Token[], date?: string, chainId?: number) {
    if (!tokens.length) {
      return {};
    }
    const chainIdToUse = chainId || tokens[0].chainId;
    const mappedTokens = tokens.map((token) => ({
      ...token,
      fetchingAddress: getTokenAddressForPriceFetching(token.chainId, token.address),
    }));
    const addresses = mappedTokens.map((token) => token.fetchingAddress);

    const prices = date
      ? await this.sdkService.sdk.priceService.getHistoricalPricesForChain({
          chainId: chainIdToUse,
          addresses,
          timestamp: parseInt(date, 10),
        })
      : await this.sdkService.sdk.priceService.getCurrentPricesForChain({ chainId: chainIdToUse, addresses });

    const tokensPrices = mappedTokens
      .filter((token) => prices[token.fetchingAddress] && prices[token.fetchingAddress].price)
      .reduce<Record<string, bigint>>((acc, token) => {
        let returnedPrice = 0n;

        try {
          returnedPrice = parseNumberUsdPriceToBigInt(prices[token.fetchingAddress].price);
        } catch (e) {
          console.error('Error parsing price for', token.address, e);
        }

        return {
          ...acc,
          [token.address]: returnedPrice,
        };
      }, {});

    return tokensPrices;
  }

  async getProtocolHistoricPrices(dates: string[], chainId: number) {
    const defillamaId = DEFILLAMA_IDS[chainId] || findKey(NETWORKS, { chainId });
    if (!defillamaId) {
      return {};
    }
    const expectedResults: Promise<AxiosResponse<{ coins: Record<string, { price: number }> }>>[] = dates.map((date) =>
      this.axiosClient.get<{ coins: Record<string, { price: number }> }>(
        date
          ? `https://coins.llama.fi/prices/historical/${parseInt(
              date,
              10
            )}/${defillamaId}:${DEFILLAMA_PROTOCOL_TOKEN_ADDRESS}`
          : `https://coins.llama.fi/prices/current/${defillamaId}:${DEFILLAMA_PROTOCOL_TOKEN_ADDRESS}`
      )
    );

    const tokensPrices = await Promise.all(expectedResults);

    return tokensPrices.reduce<Record<string, bigint>>((acc, priceResponse, index) => {
      const dateToUse = dates[index];
      const price = priceResponse.data.coins[`${defillamaId}:${DEFILLAMA_PROTOCOL_TOKEN_ADDRESS}`].price;
      return {
        ...acc,
        [dateToUse]: parseNumberUsdPriceToBigInt(price),
      };
    }, {});
  }

  async getZrxGasSwapQuote(from: Token, to: Token, amount: bigint, chainId?: number) {
    const chainIdToUse = chainId || from.chainId;
    const api = ZRX_API_ADDRESS[chainIdToUse];
    const url =
      `${api}/swap/v1/quote` +
      `?sellToken=${from.address}` +
      `&buyToken=${to.address}` +
      `&skipValidation=true` +
      `&slippagePercentage=0.03` +
      `&sellAmount=${amount.toString()}` +
      `&enableSlippageProtection=false`;

    const response = await this.axiosClient.get<{
      estimatedGas: string;
      data: Address;
    }>(url);

    const { estimatedGas, data } = response.data;

    let estimatedOptimismGas: bigint | null = null;

    if (chainId === NETWORKS.optimism.chainId) {
      const oeGasOracle = await this.contractService.getOEGasOracleInstance({ chainId, readOnly: true });
      estimatedOptimismGas = await oeGasOracle.read.getL1GasUsed([data]);
    }

    return { estimatedGas, estimatedOptimismGas };
  }

  async getPriceForGraph(
    from: Token,
    to: Token,
    periodIndex = 0,
    chainId?: number,
    tentativeSpan?: number,
    tentativePeriod?: string,
    tentativeEnd?: string
  ) {
    const chainIdToUse = chainId || from.chainId;
    const wrappedProtocolToken = getWrappedProtocolToken(chainIdToUse);
    const span = tentativeSpan || INDEX_TO_SPAN[periodIndex];
    const period = tentativePeriod || INDEX_TO_PERIOD[periodIndex];
    const end = tentativeEnd || DateTime.now().toSeconds();

    const adjustedFrom =
      from.address === PROTOCOL_TOKEN_ADDRESS
        ? wrappedProtocolToken
        : { ...from, address: getTokenAddressForPriceFetching(from.chainId, from.address) };
    const adjustedTo =
      to.address === PROTOCOL_TOKEN_ADDRESS
        ? wrappedProtocolToken
        : { ...to, address: getTokenAddressForPriceFetching(to.chainId, to.address) };

    let tokenA: GraphToken;
    let tokenB: GraphToken;
    if (adjustedFrom.address < adjustedTo.address) {
      tokenA = {
        ...adjustedFrom,
        isBaseToken: STABLE_COINS.includes(adjustedFrom.symbol),
      };
      tokenB = {
        ...adjustedTo,
        isBaseToken: STABLE_COINS.includes(adjustedTo.symbol),
      };
    } else {
      tokenA = {
        ...adjustedTo,
        isBaseToken: STABLE_COINS.includes(adjustedTo.symbol),
      };
      tokenB = {
        ...adjustedFrom,
        isBaseToken: STABLE_COINS.includes(adjustedFrom.symbol),
      };
    }

    const defillamaId = DEFILLAMA_IDS[chainIdToUse] || findKey(NETWORKS, { chainId: chainIdToUse });
    if (!defillamaId) {
      return [];
    }
    const prices = await this.axiosClient.get<{
      coins: Record<string, { prices: { timestamp: number; price: number }[] }>;
    }>(
      `https://coins.llama.fi/chart/${defillamaId}:${tokenA.address},${defillamaId}:${
        tokenB.address
      }?period=${period}&span=${span}${(end && `&end=${end}`) || ''}`
    );

    const {
      data: { coins },
    } = prices;

    const tokenAPrices =
      coins && coins[`${defillamaId}:${tokenA.address}`] && coins[`${defillamaId}:${tokenA.address}`].prices;
    const tokenBPrices =
      coins && coins[`${defillamaId}:${tokenB.address}`] && coins[`${defillamaId}:${tokenB.address}`].prices;

    const tokenAIsBaseToken = STABLE_COINS.includes(tokenA.symbol) || !STABLE_COINS.includes(tokenB.symbol);

    const graphData = tokenAPrices.reduce<{ timestamp: number; rate: number }[]>((acc, { price, timestamp }, index) => {
      const tokenBPrice = tokenBPrices[index] && tokenBPrices[index].price;
      if (!tokenBPrice) {
        return acc;
      }

      return [
        ...acc,
        {
          timestamp,
          rate: tokenAIsBaseToken ? tokenBPrice / price : price / tokenBPrice,
        },
      ];
    }, []);

    return graphData;
  }
}
