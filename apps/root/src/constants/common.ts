import { TransactionActionType, PositionVersions } from '@types';

export const MAX_UINT_32 = 4294967295n;

export const {
  POSITION_VERSION_1, // BETA
  POSITION_VERSION_2, // VULN
  POSITION_VERSION_3, // POST-VULN
  POSITION_VERSION_4, // Yield
} = PositionVersions; // BETA

export const OLD_VERSIONS: PositionVersions[] = [
  PositionVersions.POSITION_VERSION_1,
  POSITION_VERSION_2,
  POSITION_VERSION_3,
];

export const LATEST_VERSION: PositionVersions = POSITION_VERSION_4;

export const VERSIONS_ALLOWED_MODIFY: PositionVersions[] = [POSITION_VERSION_4];

// export const POSITIONS_VERSIONS: PositionVersions[] = [POSITION_VERSION_2, POSITION_VERSION_3, POSITION_VERSION_4];
export const POSITIONS_VERSIONS: PositionVersions[] = [
  POSITION_VERSION_1,
  POSITION_VERSION_2,
  POSITION_VERSION_3,
  POSITION_VERSION_4,
];

export const INDEX_TO_SPAN = [24, 42, 30];

export const INDEX_TO_PERIOD = ['1h', '4h', '1d'];

export const TRANSACTION_ACTION_APPROVE_TOKEN = 'APPROVE_TOKEN';
export const TRANSACTION_ACTION_APPROVE_TOKEN_SIGN_SWAP = 'APPROVE_TOKEN_SIGN_SWAP';
export const TRANSACTION_ACTION_APPROVE_TOKEN_SIGN_DCA = 'APPROVE_TOKEN_SIGN_DCA';
export const TRANSACTION_ACTION_WAIT_FOR_SIMULATION = 'WAIT_FOR_SIMULATION';
export const TRANSACTION_ACTION_SWAP = 'SWAP';
export const TRANSACTION_ACTION_CREATE_POSITION = 'CREATE_POSITION';

export const TRANSACTION_ACTION_TYPES: Record<TransactionActionType, TransactionActionType> = {
  [TRANSACTION_ACTION_APPROVE_TOKEN]: TRANSACTION_ACTION_APPROVE_TOKEN,
  [TRANSACTION_ACTION_APPROVE_TOKEN_SIGN_SWAP]: TRANSACTION_ACTION_APPROVE_TOKEN_SIGN_SWAP,
  [TRANSACTION_ACTION_APPROVE_TOKEN_SIGN_DCA]: TRANSACTION_ACTION_APPROVE_TOKEN_SIGN_DCA,
  [TRANSACTION_ACTION_SWAP]: TRANSACTION_ACTION_SWAP,
  [TRANSACTION_ACTION_WAIT_FOR_SIMULATION]: TRANSACTION_ACTION_WAIT_FOR_SIMULATION,
  [TRANSACTION_ACTION_CREATE_POSITION]: TRANSACTION_ACTION_CREATE_POSITION,
};

export const TOKEN_BLACKLIST = [
  '0x2e9a6df78e42a30712c10a9dc4b1c8656f8f2879', // Arbitrum - Malicious MKR
  '0xb8cb8a7f4c2885c03e57e973c74827909fdc2032', // Polygon - Weird YFI
  '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000', // Optimism - WTF optimism
  '0xb584516c8d90f133a48af5cc445cc5d924cf9863', // POLY ZKEVM - DUPLICATE WETH
  '0xe765a819dbefdec134db20f0b82a2f3f13a5cd4a', // POLY ZKEVM - DUPLICATE FPI
  '0x2b684d1bab13a547cd196ca6168d59509d9e9b37', // POLY ZKEVM - DUPLICATE FPIS
  '0x95e4e1554a3f20932b559470eb57c56b7a26d10e', // POLY ZKEVM - DUPLICATE FRAX
  '0x3e7bd82b7dbce275ff86ff419d8bdf37b05e574b', // POLY ZKEVM - DUPLICATE frxETH
  '0x7940deae60fa6dbb56de469dfcddc84d2b6b17ea', // POLY ZKEVM - DUPLICATE FXS
  '0x0000000000000000000000000000000000000000', // Never allow
];

export const DCA_PAIR_BLACKLIST = [
  '0xa7a7ffe0520e90491e58c9c77f78d7cfc32d019e-0xd125443f38a69d776177c2b9c041f462936f8218', // Polygon - FBX/waWETH
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619-0xd125443f38a69d776177c2b9c041f462936f8218', // Polygon - FBX/WETH
];

export const DISABLED_YIELD_WITHDRAWS = [
  '0xcd0e5871c97c663d43c62b5049c123bb45bfe2cc', // ETH - USDC. Euler. Disabled due to hack.
  '0xd4de9d2fc1607d1df63e1c95ecbfa8d7946f5457', // ETH - WETH. Euler. Disabled due to hack.
  '0xc4113b7605d691e073c162809060b6c5ae402f1e', // ETH - DAI. Euler. Disabled due to hack.
  '0x48e345cb84895eab4db4c44ff9b619ca0be671d9', // ETH - WBTC. Euler. Disabled due to hack.
  '0xb95e6eee428902c234855990e18a632fa34407dc', // ETH - LUSD. Euler. Disabled due to hack.
  '0x7c6d161b367ec0605260628c37b8dd778446256b', // ETH - wstETH. Euler. Disabled due to hack.
].map((a) => a.toLowerCase());

export const WALLET_CONNECT_PROJECT_ID = '052f72d940052c096c832ee451b63a14';

export const PERMIT_2_WORDS = [
  26796124394618, 127929636361453, 170674725395413, 245314029271115, 112668572444312, 160360459603706, 81390189777037,
  45971267251243, 192306453693214, 70077137466196,
];
