import { createAction } from '@reduxjs/toolkit';
import { ChainId, StrategyYieldType, Token } from 'common-types';

export const setAssetFilter = createAction<Token[]>('allStrategiesFilters/setAssetFilter');

export const setNetworkFilter = createAction<ChainId[]>('allStrategiesFilters/setNetworkFilter');

export const setRewardFilter = createAction<Token[]>('allStrategiesFilters/setRewardFilter');

export const setFarmFilter = createAction<string[]>('allStrategiesFilters/setFarmFilter');

export const setGuardianFilter = createAction<string[]>('allStrategiesFilters/setGuardianFilter');

export const setYieldTypeFilter = createAction<StrategyYieldType[]>('allStrategiesFilters/setYieldTypeFilter');
