import { BigNumber } from 'ethers';
import { TransactionTypesConstant } from 'types';

export const NETWORKS = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum mainnet',
  },
  ropsten: {
    chainId: 3,
    name: 'Ropsten',
  },
  rinkeby: {
    chainId: 4,
    name: 'Rinkeby',
  },
  goerli: {
    chainId: 5,
    name: 'Goerli',
  },
  kovan: {
    chainId: 42,
    name: 'Kovan',
  },
  meanfinance: {
    chainId: 31337,
    name: 'Mean Finance',
  },
  bsc: {
    chainId: 56,
    name: 'BSC',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
  },
  fantom: {
    chainId: 250,
    name: 'Fantom',
  },
  avalanche: {
    chainId: 43114,
    name: 'Avalanche',
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum',
  },
  heco: {
    chainId: 128,
    name: 'Heco',
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
  },
  okex: {
    chainId: 66,
    name: 'OKEx',
  },
  harmony: {
    chainId: 1666600000,
    name: 'Harmony',
  },
  xdai: {
    chainId: 100,
    name: 'xDAI',
  },
};

export const SUPPORTED_NETWORKS = [
  NETWORKS.mainnet.chainId,
  NETWORKS.ropsten.chainId,
  NETWORKS.rinkeby.chainId,
  NETWORKS.goerli.chainId,
  NETWORKS.kovan.chainId,
];

export const HUB_ADDRESS = '0x4384f6e940C9bF5e56df63064e38CB9c5Af4A8Bc';
export const TOKEN_DESCRIPTOR_ADDRESS = '0x2B5384Ba9CE1cF889Ef758E14B6E9B7abb6e4bbF';

export const MEAN_GRAPHQL_URL = {
  [NETWORKS.mainnet.chainId]: 'https://api.thegraph.com/subgraphs/name/mean-finance/dca-v1',
  [NETWORKS.ropsten.chainId]: 'https://api.thegraph.com/subgraphs/name/mean-finance/dca-v1-ropsten',
  [NETWORKS.rinkeby.chainId]: 'https://api.thegraph.com/subgraphs/name/mean-finance/dca-v1-rinkeby',
  [NETWORKS.goerli.chainId]: 'https://api.thegraph.com/subgraphs/name/mean-finance/dca-v1-goerli',
  [NETWORKS.kovan.chainId]: 'https://api.thegraph.com/subgraphs/name/mean-finance/dca-v1dot1-kovan',
  [NETWORKS.meanfinance.chainId]: 'http://3.235.77.84:8000/subgraphs/name/alejoamiras/dca-subgraph',
};

export const UNI_GRAPHQL_URL = {
  [NETWORKS.mainnet.chainId]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  [NETWORKS.ropsten.chainId]: 'https://api.thegraph.com/subgraphs/name/alejoamiras/uniswap-v3-ropsten',
  [NETWORKS.rinkeby.chainId]: 'https://api.thegraph.com/subgraphs/name/alejoamiras/uniswap-v3-rinkeby',
  [NETWORKS.goerli.chainId]: 'https://api.thegraph.com/subgraphs/name/storres93/uniswap-v3-goerli',
  [NETWORKS.kovan.chainId]: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/uniswap-v3-kovan',
  [NETWORKS.meanfinance.chainId]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
};

export const EXPLORER_URL = {
  [NETWORKS.mainnet.chainId]: 'https://etherscan.io/',
  [NETWORKS.ropsten.chainId]: 'https://ropsten.etherscan.io/',
  [NETWORKS.rinkeby.chainId]: 'https://rinkeby.etherscan.io/',
  [NETWORKS.goerli.chainId]: 'https://goerli.etherscan.io/',
  [NETWORKS.kovan.chainId]: 'https://kovan.etherscan.io/',
  [NETWORKS.meanfinance.chainId]: 'https://etherscan.io/',
  [NETWORKS.bsc.chainId]: 'https://bscscan.com',
  [NETWORKS.polygon.chainId]: 'https://polygonscan.com',
  [NETWORKS.fantom.chainId]: 'https://ftmscan.com/',
  [NETWORKS.avalanche.chainId]: 'https://cchain.explorer.avax.network/',
  [NETWORKS.arbitrum.chainId]: 'https://arbiscan.io/',
  [NETWORKS.heco.chainId]: 'https://scan.hecochain.com/',
  [NETWORKS.optimism.chainId]: 'https://optimistic.etherscan.io/',
  [NETWORKS.okex.chainId]: 'https://www.oklink.com/okexchain/',
  [NETWORKS.harmony.chainId]: 'https://explorer.harmony.one/#/',
  [NETWORKS.xdai.chainId]: 'https://blockscout.com/xdai/mainnet/',
};

export const TRANSACTION_TYPES: TransactionTypesConstant = {
  NEW_POSITION: 'NEW_POSITION',
  NEW_PAIR: 'NEW_PAIR',
  APPROVE_TOKEN: 'APPROVE_TOKEN',
  TERMINATE_POSITION: 'TERMINATE_POSITION',
  WITHDRAW_POSITION: 'WITHDRAW_POSITION',
  ADD_FUNDS_POSITION: 'ADD_FUNDS_POSITION',
  MODIFY_SWAPS_POSITION: 'MODIFY_SWAPS_POSITION',
  MODIFY_RATE_AND_SWAPS_POSITION: 'MODIFY_RATE_AND_SWAPS_POSITION',
  REMOVE_FUNDS: 'REMOVE_FUNDS',
  RESET_POSITION: 'RESET_POSITION',
  WRAP_ETHER: 'WRAP_ETHER',
  NO_OP: 'NO_OP',
};

export const FULL_DEPOSIT_TYPE = 'full_deposit';
export const RATE_TYPE = 'by_rate';

export const MODE_TYPES = {
  FULL_DEPOSIT: {
    label: 'Full deposit',
    id: FULL_DEPOSIT_TYPE,
  },
  RATE: {
    label: 'By rate',
    id: RATE_TYPE,
  },
};

export const MINIMUM_LIQUIDITY_USD = parseFloat('350000');

export const POSSIBLE_ACTIONS = {
  createPair: 'createPair',
  createPosition: 'createPosition',
  approveToken: 'approveToken',
};

export const TOKEN_LISTS = {
  'tokens.1inch.eth': {
    name: '1inch',
    homepage: '',
  },
  'https://www.gemini.com/uniswap/manifest.json': {
    name: 'Gemini Token List',
    homepage: 'https://www.gemini.com/',
  },
  'https://gateway.ipfs.io/ipns/tokens.uniswap.org': {
    name: 'Uniswap Default List',
    homepage: '',
  },
  'https://tokens.coingecko.com/uniswap/all.json': {
    name: 'CoinGecko',
    homepage: '',
  },
};

export const STABLE_COINS = ['DAI', 'USDT', 'USDC', 'BUSD', 'UST'];

export const ONE_MINUTE = BigNumber.from(60);
export const FIVE_MINUTES = ONE_MINUTE.mul(BigNumber.from(5));
export const FIFTEEN_MINUTES = FIVE_MINUTES.mul(BigNumber.from(3));
export const THIRTY_MINUTES = FIFTEEN_MINUTES.mul(BigNumber.from(2));
export const ONE_HOUR = THIRTY_MINUTES.mul(BigNumber.from(2));
export const FOUR_HOURS = ONE_HOUR.mul(BigNumber.from(4));
export const ONE_DAY = FOUR_HOURS.mul(BigNumber.from(6));
export const ONE_WEEK = ONE_DAY.mul(BigNumber.from(7));

export const SWAP_INTERVALS = {
  hour: ONE_HOUR,
  day: ONE_DAY,
  week: ONE_WEEK,
};

export const STRING_SWAP_INTERVALS = {
  [ONE_MINUTE.toString()]: {
    singular: '1 minute',
    plural: '1 minute',
    adverb: '1 minutely',
  },
  [FIVE_MINUTES.toString()]: {
    singular: '5 minutes',
    plural: '5 minutes',
    adverb: '5 minutely',
  },
  [FIFTEEN_MINUTES.toString()]: {
    singular: '15 minutes',
    plural: '15 minutes',
    adverb: '15 minutely',
  },
  [THIRTY_MINUTES.toString()]: {
    singular: '30 minutes',
    plural: '30 minutes',
    adverb: '30 minutely',
  },
  [ONE_HOUR.toString()]: {
    singular: 'hour',
    plural: 'hours',
    adverb: 'hourly',
  },
  [FOUR_HOURS.toString()]: {
    singular: '4 hours',
    plural: '4 hours',
    adverb: '4 hourly',
  },
  [ONE_DAY.toString()]: {
    singular: 'day',
    plural: 'days',
    adverb: 'daily',
  },
  [ONE_WEEK.toString()]: {
    singular: 'week',
    plural: 'weeks',
    adverb: 'weekly',
  },
};
