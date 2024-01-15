import React, { PropsWithChildren } from 'react';
import styled, { useTheme } from 'styled-components';
import { SplitButton, SplitButtonOptions } from '../split-button';
import { Typography } from '../typography';
import { Dialog } from '../dialog';
import { DialogActions } from '../dialogactions';
import { DialogContent } from '../dialogcontent';
import { IconButton } from '../iconbutton';
import { Breakpoint } from '../breakpoint';
import { CloseIcon } from '../../icons';
import { Button, ButtonProps } from '../button';
import { FormattedMessage } from 'react-intl';
import { colors } from '../../theme';

const StyledDialogContent = styled(DialogContent)<{ withTitle: boolean }>`
  display: flex;
  align-items: ${({ withTitle }) => (withTitle ? 'stretch' : 'center')};
  justify-content: center;
  padding: 0px;
  ${({ withTitle }) => withTitle && 'flex-direction: column;'}
  overflow-y: visible;
`;

const StyledDialogColumnContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px;
  flex-grow: 1;
`;

const StyledDialogTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 0;
  margin-bottom: 28px;
`;

const StyledDialogActions = styled(DialogActions)`
  ${({ theme: { spacing } }) => `
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${spacing(6)};
`}
`;

const StyledDialog = styled(Dialog)`
  ${({ theme: { palette, spacing } }) => `
  text-align: center;
  & .MuiPaper-root {
    background-color: ${colors[palette.mode].background.tertiary};
    border-radius: ${spacing(2)};
    padding: ${spacing(12)} ${spacing(10)} ${spacing(10)};
    gap: ${spacing(6)};
  }
  `}
`;

const StyledCloseIconButton = styled(IconButton)`
  ${({ theme: { spacing } }) => `
  position: absolute;
  bottom: ${spacing(5)};
  left: ${spacing(-2)};
  `}
`;

export interface ModalProps extends PropsWithChildren {
  open: boolean;
  onClose?: () => void;
  showCloseIcon?: boolean;
  showCloseButton?: boolean;
  maxWidth?: Breakpoint;
  title?: React.ReactNode;
  headerButton?: React.ReactNode;
  fullHeight?: boolean;
  keepMounted?: boolean;
  closeOnBackdrop?: boolean;
  actions?: {
    label: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    color?: ButtonProps['color'];
    variant?: 'text' | 'outlined' | 'contained';
    options?: SplitButtonOptions;
  }[];
}

const Modal: React.FC<ModalProps> = ({
  title,
  open,
  onClose,
  maxWidth,
  showCloseIcon,
  showCloseButton,
  actions,
  fullHeight,
  keepMounted,
  children,
  closeOnBackdrop,
  headerButton,
}) => {
  const {
    palette: { mode },
  } = useTheme();

  const handleClose = () => {
    if (onClose && (showCloseButton || showCloseIcon || closeOnBackdrop)) {
      onClose();
    }
  };

  const withTitle = showCloseIcon || !!title;

  const fullHeightProps = (fullHeight && { sx: { height: '90vh' } }) || {};

  return (
    <StyledDialog
      open={open}
      fullWidth
      maxWidth={maxWidth || 'lg'}
      onClose={handleClose}
      PaperProps={fullHeightProps}
      keepMounted={keepMounted}
    >
      <StyledDialogContent withTitle={withTitle || !!fullHeight}>
        {withTitle && (
          <StyledDialogTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography variant="h4" fontWeight="bold" color={colors[mode].typography.typo1}>
                {title}
              </Typography>
              {headerButton}
            </div>
            <div style={{ position: 'relative', display: 'flex' }}>
              <StyledCloseIconButton aria-label="close" onClick={onClose}>
                <CloseIcon sx={{ color: colors[mode].typography.typo2 }} />
              </StyledCloseIconButton>
            </div>
          </StyledDialogTitle>
        )}
        {withTitle || !!fullHeight ? <StyledDialogColumnContent>{children}</StyledDialogColumnContent> : children}
      </StyledDialogContent>
      {(showCloseButton || !!actions?.length) && (
        <StyledDialogActions>
          {showCloseButton && (
            <Button onClick={onClose} variant="outlined" color="primary" size="large" fullWidth>
              <FormattedMessage description="Close" defaultMessage="Close" />
            </Button>
          )}
          {actions?.map((action, index) =>
            action.options ? (
              <SplitButton
                onClick={action.onClick}
                text={action.label}
                disabled={action.disabled}
                variant={action.variant ?? 'contained'}
                color={action.color ?? 'primary'}
                options={action.options}
                size="large"
                fullWidth
                block
                key={index}
              />
            ) : (
              <Button
                onClick={action.onClick}
                disabled={action.disabled}
                variant={action.variant ?? 'contained'}
                color={action.color ?? 'primary'}
                size="large"
                fullWidth
                key={index}
              >
                {action.label}
              </Button>
            )
          )}
        </StyledDialogActions>
      )}
    </StyledDialog>
  );
};

export { Modal };
