import { createReducer } from '@reduxjs/toolkit';
import { SwapOption, Token } from 'types';
import {
  setFromValue,
  setFrom,
  setTo,
  setToValue,
  setSelectedRoute,
  setSorting,
  resetForm,
  setTransferTo,
} from './actions';

export interface AggregatorState {
  fromValue: string;
  toValue: string;
  from: Token | null;
  to: Token | null;
  isBuyOrder: boolean;
  selectedRoute: SwapOption | null;
  sorting: string;
  transferTo: null | string;
}

const initialState: AggregatorState = {
  fromValue: '',
  toValue: '',
  from: null,
  to: null,
  isBuyOrder: false,
  selectedRoute: null,
  sorting: 'most-profit',
  transferTo: null,
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(setFromValue, (state, { payload: { value, updateMode } }) => {
      state.fromValue = value;
      if (updateMode) {
        state.isBuyOrder = false;
      }
    })
    .addCase(setToValue, (state, { payload: { value, updateMode } }) => {
      state.toValue = value;
      if (updateMode) {
        state.isBuyOrder = true;
      }
    })
    .addCase(setFrom, (state, { payload }) => {
      state.from = payload;
    })
    .addCase(setTo, (state, { payload }) => {
      state.to = payload;
    })
    .addCase(setSelectedRoute, (state, { payload }) => {
      state.selectedRoute = payload;
    })
    .addCase(setSorting, (state, { payload }) => {
      state.sorting = payload;
    })
    .addCase(setTransferTo, (state, { payload }) => {
      state.transferTo = payload;
    })
    .addCase(resetForm, (state) => {
      state.fromValue = '';
      state.toValue = '';
      state.transferTo = null;
      state.selectedRoute = null;
      state.sorting = 'most-profit';
    })
);