import { LATEST_VERSION, ONE_DAY, TOKEN_TYPE_BASE } from 'config/constants';
import { Position } from 'types';
import { BigNumber } from 'ethers';
import { PROTOCOL_TOKEN_ADDRESS } from './tokens';

export const EmptyPosition: Position = {
  from: {
    address: PROTOCOL_TOKEN_ADDRESS,
    name: 'PROTOCOL TOKEN',
    decimals: 18,
    chainId: 10,
    symbol: 'MEAN',
    type: TOKEN_TYPE_BASE,
    underlyingTokens: [],
  },
  to: {
    address: PROTOCOL_TOKEN_ADDRESS,
    name: 'PROTOCOL TOKEN',
    decimals: 18,
    chainId: 10,
    symbol: 'MEAN',
    type: TOKEN_TYPE_BASE,
    underlyingTokens: [],
  },
  swapInterval: ONE_DAY,
  user: PROTOCOL_TOKEN_ADDRESS,
  swapped: BigNumber.from(0),
  remainingLiquidity: BigNumber.from(0),
  rate: BigNumber.from(1),
  depositedRateUnderlying: BigNumber.from(1),
  accumSwappedUnderlying: BigNumber.from(1),
  accumToWithdrawUnderlying: BigNumber.from(1),
  remainingSwaps: BigNumber.from(0),
  totalDeposited: BigNumber.from(0),
  withdrawn: BigNumber.from(0),
  totalSwaps: BigNumber.from(0),
  toWithdraw: BigNumber.from(0),
  id: 'PROTOCOL',
  positionId: 'PROTOCOL',
  startedAt: 0,
  status: 'TERMINATED',
  pendingTransaction: '',
  totalExecutedSwaps: BigNumber.from(0),
  version: LATEST_VERSION,
  chainId: 10,
  pairLastSwappedAt: 0,
  pairNextSwapAvailableAt: '0',
};
