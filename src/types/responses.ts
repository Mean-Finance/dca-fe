import { BigNumber } from 'ethers';
import { Token } from './tokens';

export interface PoolLiquidityData {
  id: string;
  poolHourData: {
    id: string;
    volumeUSD: string;
  }[];
}

export type PoolsLiquidityData = PoolLiquidityData[];

export interface PoolsLiquidityDataGraphqlResponse {
  pools: PoolsLiquidityData;
}
export interface GetPairResponseSwapData {
  id: string;
  executedAtTimestamp: string;
  ratePerUnitAToB: string;
  ratePerUnitBToA: string;
}

export interface GetPairPriceResponseData {
  pair: {
    id: string;
    swaps: GetPairResponseSwapData[];
  };
}

export interface PositionsGraphqlResponse {
  positions: PositionResponse[];
}

export interface SwapIntervalGraphqlResponse {
  id: string;
  interval: string;
  active: boolean;
}
export interface GetSwapIntervalsGraphqlResponse {
  swapIntervals: SwapIntervalGraphqlResponse[];
}
export type PositionResponse = {
  id: string;
  from: Token;
  to: Token;
  user: string;
  pair: {
    id: string;
    nextSwapAvailableAt: string;
    swaps: {
      id: string;
      executedAtTimestamp: string;
    }[];
  };
  status: string;
  executedSwaps: BigNumber;
  swapInterval: {
    id: string;
    interval: BigNumber;
    description: BigNumber;
  };
  current: {
    id: string;
    rate: BigNumber;
    remainingSwaps: BigNumber;
    swapped: BigNumber;
    withdrawn: BigNumber;
    remainingLiquidity: BigNumber;
    idleSwapped: BigNumber;
  };
  rate: BigNumber;
  totalDeposits: BigNumber;
  totalSwaps: BigNumber;
  totalSwapped: BigNumber;
  totalWithdrawn: BigNumber;
  createdAtTimestamp: number;
};

export interface TxPriceResponse {
  unit: string;
  blockPrices: {
    estimatedPrices: {
      price: number;
      maxPriorityFeePerGas: number;
      maxFeePerGas: number;
    }[];
  }[];
}
export interface CoinGeckoTokenPriceResponse {
  id: string;
  current_price: number;
}

export type CoinGeckoPriceResponse = CoinGeckoTokenPriceResponse[];

export interface UsedTokenInfo {
  address: string;
}

export interface UsedToken {
  tokenInfo: UsedTokenInfo;
}

export interface GetUsedTokensData {
  tokens: UsedToken[];
}

export interface GetUsedTokensDataResponse {
  data: GetUsedTokensData;
}

export type GetAllowanceResponse = {
  allowance: string;
  token: Token;
};

export interface EstimatedPairResponse {
  gas: string;
  gasUsd: number;
  gasEth: BigNumber;
}

export type GetPoolResponse = {
  pools: {
    id: string;
  }[];
};

export type PoolResponse = {
  token0: {
    decimals: string;
    id: string;
    name: string;
    symbol: string;
    totalValueLockedUSD: string;
    chainId: number;
  };
  token1: {
    decimals: string;
    id: string;
    name: string;
    symbol: string;
    totalValueLockedUSD: string;
    chainId: number;
  };
  id: string;
};

export interface PoolsGraphqlResponse {
  pools: PoolResponse[];
}
export interface AvailablePairSwap {
  executedAtTimestamp: number;
}

export type AvailablePairResponse = {
  tokenA: Token;
  tokenB: Token;
  id: string;
  swaps: AvailablePairSwap[];
  createdAtTimestamp: number;
  status: string; // active, stale
  positions: PositionResponse[];
  nextSwapAvailableAt: string;
};

export interface AvailablePairsGraphqlResponse {
  pairs: AvailablePairResponse[];
}
