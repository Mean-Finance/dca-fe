import { PaletteOptions } from '@mui/material';
import { baseColors, colors } from './colors';

const basePallete: PaletteOptions = {
  common: {
    black: baseColors.black,
    white: baseColors.white,
  },
  action: {
    active: '#fff',
    hover: 'rgba(255, 255, 255, 0.08)',
    hoverOpacity: 0.08,
    selected: 'rgba(255, 255, 255, 0.16)',
    selectedOpacity: 0.16,
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(255, 255, 255, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.24,
  },
  grey: {
    50: baseColors.greyscale.greyscale0,
    100: baseColors.greyscale.greyscale1,
    200: baseColors.greyscale.greyscale2,
    300: baseColors.greyscale.greyscale3,
    400: baseColors.greyscale.greyscale4,
    500: baseColors.greyscale.greyscale5,
    600: baseColors.greyscale.greyscale6,
    700: baseColors.greyscale.greyscale7,
    800: baseColors.greyscale.greyscale8,
    900: baseColors.greyscale.greyscale9,
    A100: '#f5f5f5',
    A200: '#eeeeee',
    A400: '#bdbdbd',
    A700: '#616161',
  },
  contrastThreshold: 3,
  tonalOffset: 0.2,
  divider: 'rgba(255, 255, 255, 0.12)',
};
export const darkModePallete: PaletteOptions = {
  ...basePallete,
  mode: 'dark',
  primary: {
    main: colors.dark.accentPrimary,
    dark: colors.dark.violet.violet700,
    contrastText: colors.dark.violet.violet900,
  },
  secondary: {
    main: colors.dark.aqua.aqua500,
    dark: colors.dark.aqua.aqua800,
    contrastText: colors.dark.aqua.aqua100,
  },
  error: {
    main: colors.dark.semantic.error,
  },
  warning: {
    main: colors.dark.semantic.warning,
  },
  success: {
    main: colors.dark.semantic.success,
  },
  info: {
    //default
    main: '#29b6f6',
    light: '#4fc3f7',
    dark: '#0288d1',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // transparent: {
  //   main: 'rgba(255, 255, 255, 0.1)',
  // },
  // default: {
  //   main: '#292929',
  // },
  // migrate: {
  //   main: '#00A3F5',
  // },
  // pending: {
  //   main: '#F9DCF4',
  // },
  background: {
    paper: colors.dark.violet.violet200,
    default: colors.dark.violet.violet100,
  },
  text: {
    primary: '#fff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
};

export const lightModePallete: PaletteOptions = {
  ...basePallete,
  mode: 'light',
  primary: {
    main: colors.light.accentPrimary,
    dark: colors.light.violet.violet300,
    contrastText: colors.light.violet.violet100,
  },
  secondary: {
    main: colors.light.aqua.aqua500,
    dark: colors.light.aqua.aqua200,
    contrastText: colors.light.aqua.aqua900,
  },
  error: {
    main: colors.light.semantic.error,
  },
  warning: {
    main: colors.light.semantic.warning,
  },
  success: {
    main: colors.light.semantic.success,
  },
  background: {
    paper: colors.light.violet.violet800,
    default: colors.light.violet.violet900,
  },
};
