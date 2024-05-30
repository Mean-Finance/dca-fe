import { ApiStrategy, StrategyYieldType } from 'common-types';

export const mockApiStrategy: ApiStrategy = {
  chainId: 10,
  asset: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // USDC
  farm: {
    id: 'aave',
    name: 'AAVE',
    tvl: 1 * 10 ** 6,
    yieldType: StrategyYieldType.LENDING,
  },
  id: 'aave-usdc',
  rewards: [{ apy: 8, token: '0x0b2c639c533813f4aa9d7837caf62653d097ff85' }],
  guardian: {
    description: 'X Guardian protection',
    fees: [{ percentage: 0.1, type: 'deposit' }],
    name: 'X',
  },
};