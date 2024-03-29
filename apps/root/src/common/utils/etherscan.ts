import { EXPLORER_URL } from '@constants';

export const buildEtherscanTransaction = (tx: string, network: number) => `${EXPLORER_URL[network]}tx/${tx}`;

export const buildEtherscanAddress = (tx: string, network: number) => `${EXPLORER_URL[network]}address/${tx}`;
