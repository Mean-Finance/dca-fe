import { BigNumber } from 'ethers/lib/ethers';

export const MAX_UINT_32 = 4294967295;

export const MAX_BI = BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935');

type PositionVersion1Type = '1';
type PositionVersion2Type = '2';
type PositionVersion3Type = '3';
type PositionVersion4Type = '4';
export const POSITION_VERSION_1: PositionVersion1Type = '1'; // BETA
export const POSITION_VERSION_2: PositionVersion2Type = '2'; // VULN
export const POSITION_VERSION_3: PositionVersion3Type = '3'; // POST-VULN
export const POSITION_VERSION_4: PositionVersion4Type = '4'; // Yield

export type PositionVersions =
  | PositionVersion1Type
  | PositionVersion2Type
  | PositionVersion3Type
  | PositionVersion4Type;

export const OLD_VERSIONS: PositionVersions[] = [POSITION_VERSION_1, POSITION_VERSION_2, POSITION_VERSION_3];

export const LATEST_VERSION: PositionVersions = POSITION_VERSION_4;

export const VERSIONS_ALLOWED_MODIFY: PositionVersions[] = [POSITION_VERSION_3, POSITION_VERSION_4];

// export const POSITIONS_VERSIONS: PositionVersions[] = [POSITION_VERSION_2, POSITION_VERSION_3, POSITION_VERSION_4];
export const POSITIONS_VERSIONS: PositionVersions[] = [
  POSITION_VERSION_1,
  POSITION_VERSION_2,
  POSITION_VERSION_3,
  POSITION_VERSION_4,
];

export const TOKEN_TYPE_BASE = 'BASE';
export const TOKEN_TYPE_WRAPPED = 'WRAPPED_PROTOCOL_TOKEN';
export const TOKEN_TYPE_YIELD_BEARING_SHARES = 'YIELD_BEARING_SHARES';
