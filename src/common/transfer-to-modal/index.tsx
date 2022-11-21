import React from 'react';
import styled from 'styled-components';
import Modal from 'common/modal';
import Button from 'common/button';
import { FormattedMessage } from 'react-intl';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { useAppDispatch } from 'state/hooks';
import { setTransferTo } from 'state/aggregator/actions';
import { buildEtherscanAddress } from 'utils/etherscan';
import useCurrentNetwork from 'hooks/useCurrentNetwork';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

const StyledTransferContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  flex: 1;
`;

const StyledWalletContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
`;

interface TransferToModalProps {
  transferTo: string | null;
  open: boolean;
  onCancel: () => void;
}

const inputRegex = RegExp(/^[A-Fa-f0-9x]*$/);
const validRegex = RegExp(/^0x[A-Fa-f0-9]{40}$/);

const TransferToModal = ({ transferTo, open, onCancel }: TransferToModalProps) => {
  const dispatch = useAppDispatch();
  const [toAddress, setToAddress] = React.useState(transferTo);
  const [validateCheckbox, setValidateCheckbox] = React.useState(false);
  const currentNetwork = useCurrentNetwork();

  const validator = (nextValue: string) => {
    // sanitize value
    if (inputRegex.test(nextValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
      setToAddress(nextValue);
    }
  };

  const handleTransfer = () => {
    dispatch(setTransferTo(toAddress));
    onCancel();
  };

  const onPasteAddress = async () => {
    const value = await navigator.clipboard.readText();

    setToAddress(value);
  };

  const isValid = validRegex.test(toAddress || '');

  const onGoToEtherscan = () => {
    const url = buildEtherscanAddress(toAddress || '', currentNetwork.chainId);
    window.open(url, '_blank');
  };

  React.useEffect(() => {
    setToAddress(transferTo);
    setValidateCheckbox(false);
  }, [transferTo]);

  return (
    <Modal
      open={open}
      showCloseIcon
      onClose={onCancel}
      maxWidth="md"
      title={<FormattedMessage description="transfer to title" defaultMessage="Transfer swap to another address" />}
      actions={[
        {
          label: <FormattedMessage description="transfer to selectAddress" defaultMessage="Select address" />,
          color: 'secondary',
          variant: 'contained',
          disabled: toAddress === '' || (!isValid && toAddress !== '') || !validateCheckbox,
          onClick: handleTransfer,
        },
      ]}
    >
      <StyledTransferContainer>
        <StyledWalletContainer>
          <Typography variant="body1">
            <FormattedMessage description="wallet" defaultMessage="Wallet:" />
          </Typography>
          <Button variant="text" color="secondary" onClick={onPasteAddress}>
            <FormattedMessage description="paste" defaultMessage="Paste" />
          </Button>
        </StyledWalletContainer>
        <TextField
          id="toAddress"
          value={toAddress}
          placeholder="Set the address to transfer to"
          autoComplete="off"
          autoCorrect="off"
          error={toAddress !== '' && toAddress !== null && !isValid}
          helperText={toAddress !== '' && toAddress !== null && !isValid ? 'This is not a valid address' : ''}
          fullWidth
          type="text"
          margin="normal"
          spellCheck="false"
          onChange={(evt) => validator(evt.target.value)}
          // eslint-disable-next-line react/jsx-no-duplicate-props
          inputProps={{
            pattern: '^0x[A-Fa-f0-9]*$',
            minLength: 1,
            maxLength: 79,
          }}
        />
        <Typography variant="body2">
          <Button variant="text" color="secondary" onClick={onGoToEtherscan} disabled={!isValid}>
            <Typography variant="body2" component="span">
              <FormattedMessage description="view on chain explorer" defaultMessage="View on chain explorer" />
            </Typography>
            <OpenInNewIcon style={{ fontSize: '1rem' }} />
          </Button>
        </Typography>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={validateCheckbox}
                onChange={(evt) => setValidateCheckbox(evt.target.checked)}
                name="validateCheckbox"
              />
            }
            label={
              <FormattedMessage
                description="transferToValidateCheckboxLabel"
                defaultMessage="I confirm that the direction above is correct"
              />
            }
          />
        </FormGroup>
      </StyledTransferContainer>
    </Modal>
  );
};
export default TransferToModal;
