import { PaletteMode } from '@mui/material';
import { TypographyOptions } from '@mui/material/styles/createTypography';
import { colors } from './colors';

export const buildTypographyVariant = (mode: PaletteMode): TypographyOptions => ({
  fontFamily: "'Inter', sans-serif",
  displayXl: {
    fontFamily: 'Space Grotesk',
    fontSize: '12.5rem', // 200/16
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: 0.64, // 128/200
    letterSpacing: '-0.005em', // -1/200
  },
  displayLg: {
    fontFamily: 'Space Grotesk',
    fontSize: '8rem', // 128/16
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: 0.5, // 64/128
    letterSpacing: '-0.0078125em', // -1/128
  },
  displayMd: {
    fontFamily: 'Space Grotesk',
    fontSize: '6rem', // 96/16
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: 1, // 96/96
  },
  displayXs: {
    fontFamily: 'Space Grotesk',
    fontSize: '5rem', // 80/16
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: 'normal',
    letterSpacing: '-0.0125em', // -1/80
  },
  h1: {
    fontFamily: 'Inter',
    fontSize: '3.3125rem', // 53/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.20755, // 64/53
    letterSpacing: '-0.0188679em', // -1/53
  },
  h2: {
    fontFamily: 'Inter',
    fontSize: '2.6875rem', // 43/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.2093, // 52/43
    letterSpacing: '-0.0232558em', // -1/43
  },
  h3: {
    fontFamily: 'Inter',
    fontSize: '2.125rem', // 34/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.17647, // 40/34
    letterSpacing: '-0.0294118em', // -1/34
  },
  h4: {
    fontFamily: 'Inter',
    fontSize: '1.6875rem', // 27/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.18519, // 32/27
  },
  h5: {
    fontFamily: 'Inter',
    fontSize: '1.375rem', // 22/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.27273, // 28/22
    color: colors[mode].typography.typo2,
  },
  h6: {
    fontFamily: 'Inter',
    fontSize: '1.125rem', // 18/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.33333, // 24/18
  },
  label: {
    fontFamily: 'Space Grotesk',
    fontSize: '1rem', // 16/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.25, // 20/16
    textTransform: 'uppercase',
  },
  bodyLarge: {
    fontFamily: 'Inter',
    fontSize: '1.5rem', // 24/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.33333, // 32/24
    letterSpacing: '-0.01em', // -0.24/24
  },
  body: {
    fontFamily: 'Inter',
    fontSize: '1rem', // 16/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 2, // 32/16
    color: colors[mode].typography.typo2,
  },
  body1: {
    fontFamily: 'Inter',
    fontSize: '1rem', // 16/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 2, // 32/16
  },
  button: {
    fontFamily: 'Inter',
    fontSize: '0.875rem', // 14/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.14286, // 16/14
  },
  bodySmall: {
    fontFamily: 'Inter',
    fontSize: '0.875rem', // 14/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.14286, // 16/14
    color: colors[mode].typography.typo3,
  },
  body2: {
    fontFamily: 'Inter',
    fontSize: '0.875rem', // 14/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.14286, // 16/14
  },
  bodyExtraSmall: {
    fontFamily: 'Inter',
    fontSize: '0.625rem', // 10/16
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 1.2, // 12/10
  },
});
