import React from 'react';
import styled from 'styled-components';
import Button from 'common/button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { FullPosition } from 'types';
import { FormattedMessage } from 'react-intl';
import Typography from '@mui/material/Typography';
import useTransactionModal from 'hooks/useTransactionModal';
import { makeStyles } from '@mui/styles';
import useWeb3Service from 'hooks/useWeb3Service';
import { useTransactionAdder } from 'state/transactions/hooks';
import { TRANSACTION_TYPES } from 'config/constants';
import TextField from '@mui/material/TextField';

const useStyles = makeStyles({
  paper: {
    borderRadius: 20,
  },
});

const StyledDialogContent = styled(DialogContent)`
  display: flex;
  flex-direction: column;
  padding: 40px 72px !important;
  align-items: center;
  justify-content: center;
  text-align: center;
  *:not(:last-child) {
    margin-bottom: 10px;
  }
`;

const StyledDialogActions = styled(DialogActions)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 32px 32px 32px;
`;

interface TransferPositionModalProps {
  position: FullPosition;
  open: boolean;
  onCancel: () => void;
}

const inputRegex = RegExp(/^0x[A-Za-z0-9]*$/);

const TransferPositionModal = ({ position, open, onCancel }: TransferPositionModalProps) => {
  const classes = useStyles();

  const [setModalSuccess, setModalLoading, setModalError] = useTransactionModal();
  const [toAddress, setToAddress] = React.useState('');
  const web3Service = useWeb3Service();
  const addTransaction = useTransactionAdder();

  const validator = (nextValue: string) => {
    // sanitize value
    if (inputRegex.test(nextValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
      setToAddress(nextValue);
    }
  };

  const handleTransfer = async () => {
    try {
      onCancel();
      setModalLoading({
        content: (
          <Typography variant="body1">
            <FormattedMessage
              description="Transfering position"
              defaultMessage="Transfering your position to {toAddress}"
              values={{ toAddress }}
            />
          </Typography>
        ),
      });
      const result = await web3Service.transfer(position, toAddress);
      addTransaction(result, {
        type: TRANSACTION_TYPES.TRANSFER_POSITION,
        typeData: { id: position.id, from: position.from.symbol, to: position.to.symbol, toAddress },
      });
      setModalSuccess({
        hash: result.hash,
        content: (
          <FormattedMessage
            description="position transfer success"
            defaultMessage="Your {from}/{to} position transfer to {toAddress} has been succesfully submitted to the blockchain and will be confirmed soon"
            values={{
              from: position.from.symbol,
              to: position.to.symbol,
              toAddress,
            }}
          />
        ),
      });
    } catch (e) {
      /* eslint-disable  @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      setModalError({
        content: 'Error while transfering position',
        error: { code: e.code, message: e.message, data: e.data },
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="xs" classes={{ paper: classes.paper }}>
      <StyledDialogContent>
        <Typography variant="h6">
          <FormattedMessage
            description="transfer title"
            defaultMessage="Transfer {from}/{to} position"
            values={{ from: position.from.symbol, to: position.to.symbol }}
          />
        </Typography>
        <Typography variant="body1">
          <FormattedMessage
            description="transfer description"
            defaultMessage="Set to whom you want to transfer your position to"
          />
        </Typography>
        <Typography variant="body1">
          <FormattedMessage
            description="transfer sub description"
            defaultMessage="This will transfer your position, your NFT and all the liquidity stored in the position to the new address."
          />
        </Typography>
        <TextField
          id="toAddress"
          value={toAddress}
          placeholder="Set the address to transfer to"
          autoComplete="off"
          autoCorrect="off"
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
        <Typography variant="body1">
          <FormattedMessage description="transfer warning" defaultMessage="This cannot be undone." />
        </Typography>
      </StyledDialogContent>
      <StyledDialogActions>
        <Button onClick={onCancel} color="default" variant="outlined" fullWidth>
          <FormattedMessage description="go back" defaultMessage="Go back" />
        </Button>
        <Button color="secondary" variant="contained" fullWidth onClick={handleTransfer} autoFocus>
          <FormattedMessage description="Transfer" defaultMessage="Transfer" />
        </Button>
      </StyledDialogActions>
    </Dialog>
  );
};
export default TransferPositionModal;
