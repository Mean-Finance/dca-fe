import React from 'react';
import { defineMessage } from 'react-intl';
import { DashboardIcon, DcaInvestIcon, SwapIcon, TransferIcon } from 'ui-library';

export const DASHBOARD_ROUTE = {
  label: defineMessage({ description: 'dashboard', defaultMessage: 'Dashboard' }),
  key: '',
  icon: <DashboardIcon />,
};
export const DCA_ROUTE = {
  label: defineMessage({ description: 'invest', defaultMessage: 'Invest (DCA)' }),
  key: 'invest',
  icon: <DcaInvestIcon />,
};
export const DCA_CREATE_ROUTE = {
  label: defineMessage({ description: 'create', defaultMessage: 'Create' }),
  key: 'create',
  icon: <DcaInvestIcon />,
};
export const DCA_POSITIONS_ROUTE = {
  label: defineMessage({ description: 'positions', defaultMessage: 'Positions' }),
  key: 'positions',
  icon: <DcaInvestIcon />,
};
export const SWAP_ROUTE = {
  label: defineMessage({ description: 'swap', defaultMessage: 'Swap' }),
  key: 'swap',
  icon: <SwapIcon />,
};
export const TRANSFER_ROUTE = {
  label: defineMessage({ description: 'transfer', defaultMessage: 'Transfer' }),
  key: 'transfer',
  icon: <TransferIcon />,
};
