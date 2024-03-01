import type { Components } from '@mui/material/styles';
import { colors } from '../colors';
import { SPACING } from '../constants';

export const buildInputBaseVariant = (mode: 'light' | 'dark'): Components => ({
  MuiInputBase: {
    styleOverrides: {
      root: {
        fontWeight: '600',
        display: 'flex',
        gap: SPACING(2),
        '&:hover': {
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: `${colors[mode].accentPrimary} !important`,
          },
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: SPACING(2),
        backgroundColor: colors[mode].background.secondary,
        color: colors[mode].typography.typo1,
        '& .MuiSvgIcon-root': {
          transition: 'color 200ms',
          color: colors[mode].typography.typo4,
        },
        '&.Mui-focused': {
          borderColor: colors[mode].accentPrimary,
          backgroundColor: colors[mode].background.tertiary,
          '.MuiSvgIcon-root': {
            color: colors[mode].typography.typo3,
          },
        },
        '&.Mui-disabled': {
          opacity: '.5',
          input: {
            WebkitTextFillColor: colors[mode].typography.typo1,
          },
        },
        input: {
          '&::placeholder': {
            fontWeight: '700',
          },
        },
      },
      notchedOutline: {
        transition: 'border 200ms',
        borderColor: colors[mode].border.border1,
      },
    },
  },
});