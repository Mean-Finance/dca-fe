import React from 'react';
import Button from 'common/button';
import styled from 'styled-components';
import { Token } from 'types';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FormHelperText from '@mui/material/FormHelperText';
import { createStyles, FilledInput, Typography } from '@mui/material';
import { withStyles, makeStyles } from '@mui/styles';
import TokenIcon from 'common/token-icon';

const StyledTokenInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const StyledControls = styled.div`
  display: flex;
  flex: 1;
  gap: 8px;
`;

const StyledSelectorContainer = styled.div`
  display: flex;
`;

const StyledFirstPartContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StyledSecondPartContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-left: 10px;
`;

const StyledButton = styled(Button)`
  padding: 4px 8px;
  align-self: flex-start;

  .MuiButton-endIcon {
    margin: 0;
  }
  .MuiButton-startIcon {
    margin: 0;
    margin-right: 4px;
  }
`;

const StyledFilledInput = withStyles(() =>
  createStyles({
    root: {
      paddingLeft: '0px',
      background: 'none !important',
    },
    input: {
      paddingTop: '0px',
      paddingBottom: '0px',
      textAlign: 'right',
      paddingRight: '0px',
    },
  })
)(FilledInput);

const StyledAmountContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
`;

const StyledFormControl = styled.div`
  display: flex;
  background-color: rgba(255, 255, 255, 0.09);
  border-radius: 8px;
  transition: background-color 200ms cubic-bezier(0, 0, 0.2, 1) 0ms;
  cursor: text;
  justify-content: center;
  flex: 1;
  flex-direction: column;
  padding: 10px 20px 10px 10px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.13);
  }
`;

const StyledUsdContainer = styled.div`
  display: flex;
  gap: 5px;
  padding-left: 12px;
`;

const typographyStyles = {
  fontFamily: 'Lato',
  fontWeight: '500',
  fontSize: '1.25rem',
  lineHeight: '1.6',
};

const useButtonStyles = makeStyles({
  root: {
    ...typographyStyles,
  },
});

interface TokenInputProps {
  id: string;
  value: string;
  disabled?: boolean;
  onChange: (newValue: string) => void;
  token: Token | null;
  error?: string;
  fullWidth?: boolean;
  usdValue?: string;
  onTokenSelect: () => void;
  impact?: string | null;
}

const AggregatorTokenInput = ({
  id,
  onChange,
  value,
  disabled,
  token,
  error,
  fullWidth,
  usdValue,
  onTokenSelect,
  impact,
}: TokenInputProps) => {
  const inputRef = React.createRef();
  const validator = (nextValue: string) => {
    // sanitize value
    const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d{0,${(token && token.decimals) || 18}}$`);

    if (inputRegex.test(nextValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
      onChange(nextValue.startsWith('.') ? `0${nextValue}` : nextValue);
    }
  };

  const onFocusInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    (inputRef.current as any).focus();
  };

  return (
    <StyledTokenInputContainer>
      <StyledControls>
        <StyledFormControl onClick={onFocusInput}>
          <Typography variant="h6" component={StyledFirstPartContainer}>
            <StyledSelectorContainer>
              <StyledButton
                size="large"
                color="transparent"
                variant="text"
                startIcon={<TokenIcon size="24px" token={token || undefined} />}
                endIcon={<KeyboardArrowDownIcon fontSize="small" />}
                onClick={onTokenSelect}
                classes={useButtonStyles()}
              >
                {token ? token.symbol : 'Select'}
              </StyledButton>
            </StyledSelectorContainer>
            <StyledAmountContainer>
              <StyledFilledInput
                id={id}
                value={value}
                error={!!error}
                inputRef={inputRef}
                placeholder="0"
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                type="text"
                margin="none"
                disabled={disabled}
                disableUnderline
                spellCheck="false"
                fullWidth={fullWidth}
                onChange={(evt) => validator(evt.target.value.replace(/,/g, '.'))}
                inputProps={{
                  style: { paddingBottom: usdValue ? '0px' : '8px', ...typographyStyles },
                }}
              />
            </StyledAmountContainer>
          </Typography>
          <StyledSecondPartContainer>
            <Typography variant="body2" color="#939494">
              {token?.name}
            </Typography>
            {usdValue && (
              <StyledUsdContainer>
                <Typography variant="body2" color="#939494">
                  ${usdValue}
                </Typography>
                {impact && (
                  <Typography variant="body2" color={Number(impact) < -5 ? '#EB5757' : 'rgba(255, 255, 255, 0.5)'}>
                    ({impact}%)
                  </Typography>
                )}
              </StyledUsdContainer>
            )}
          </StyledSecondPartContainer>
        </StyledFormControl>
      </StyledControls>
      {!!error && (
        <FormHelperText error id="component-error-text">
          {error}
        </FormHelperText>
      )}
    </StyledTokenInputContainer>
  );
};
export default AggregatorTokenInput;