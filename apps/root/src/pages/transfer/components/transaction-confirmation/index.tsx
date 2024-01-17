import React from 'react';
import styled from 'styled-components';
import { withStyles } from 'tss-react/mui';
import { useIsTransactionPending, useTransaction } from '@state/transactions/hooks';
import {
  Typography,
  CircularProgress,
  circularProgressClasses,
  Slide,
  CheckCircleIcon,
  createStyles,
  Button,
  colors,
} from 'ui-library';
import { FormattedMessage } from 'react-intl';
import useSelectedNetwork from '@hooks/useSelectedNetwork';
import { NETWORKS } from '@constants';
import usePrevious from '@hooks/usePrevious';
import { buildEtherscanTransaction } from '@common/utils/etherscan';
import confetti from 'canvas-confetti';
import { Token } from '@types';
import { useAggregatorSettingsState } from '@state/aggregator-settings/hooks';
import { useThemeMode } from '@state/config/hooks';

const StyledOverlay = styled.div`
  ${({
    theme: {
      palette: { mode },
    },
  }) => `
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 99;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: '40px';
    background-color: ${colors[mode].background.secondary}
  `}
`;

const StyledTitleContainer = styled.div`
  text-align: center;
`;

const StyledConfirmationContainer = styled.div`
  align-self: stretch;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledProgressContent = styled.div`
  position: absolute;
`;

const StyledButonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
`;

const StyledTopCircularProgress = withStyles(CircularProgress, () =>
  createStyles({
    circle: {
      stroke: "url('#progressGradient')",
      strokeLinecap: 'round',
    },
  })
);

const StyledBottomCircularProgress = withStyles(CircularProgress, () =>
  createStyles({
    root: {},
    circle: {
      strokeLinecap: 'round',
    },
  })
);

const StyledCheckCircleIcon = withStyles(CheckCircleIcon, () =>
  createStyles({
    root: {
      stroke: "url('#successGradient')",
      fill: "url('#successGradient')",
    },
  })
);

const StyledTypography = styled(Typography)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface TransactionConfirmationProps {
  shouldShow: boolean;
  handleClose: () => void;
  transaction: string;
  from: Token | null;
}

const TIMES_PER_NETWORK = {
  [NETWORKS.arbitrum.chainId]: 10,
  [NETWORKS.polygon.chainId]: 20,
  [NETWORKS.optimism.chainId]: 10,
  [NETWORKS.mainnet.chainId]: 40,
};

const DEFAULT_TIME_PER_NETWORK = 30;

const TransactionConfirmation = ({ shouldShow, handleClose, transaction, from }: TransactionConfirmationProps) => {
  const { confettiParticleCount } = useAggregatorSettingsState();
  const getPendingTransaction = useIsTransactionPending();
  const isTransactionPending = getPendingTransaction(transaction);
  const [success, setSuccess] = React.useState(false);
  const previousTransactionPending = usePrevious(isTransactionPending);
  const currentNetwork = useSelectedNetwork();
  const [timer, setTimer] = React.useState(TIMES_PER_NETWORK[currentNetwork.chainId] || DEFAULT_TIME_PER_NETWORK);
  const minutes = Math.floor(timer / 60);
  const seconds = timer - minutes * 60;
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const transactionReceipt = useTransaction(transaction);
  const mode = useThemeMode();

  const handleNewTrade = () => {
    handleClose();
  };

  React.useEffect(() => {
    if (timer > 0 && shouldShow) {
      timerRef.current = setTimeout(() => setTimer((currTimer) => currTimer - 1), 1000);
    }
  }, [timer, shouldShow]);

  React.useEffect(() => {
    setSuccess(false);
    setTimer(TIMES_PER_NETWORK[currentNetwork.chainId] || DEFAULT_TIME_PER_NETWORK);
  }, [transaction]);

  React.useEffect(() => {
    if (!success && isTransactionPending && !previousTransactionPending) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setTimer(TIMES_PER_NETWORK[currentNetwork.chainId] || DEFAULT_TIME_PER_NETWORK);
    }
    if (!isTransactionPending && previousTransactionPending) {
      setTimer(0);
      setSuccess(true);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      confetti({
        particleCount: confettiParticleCount,
        spread: 70,
        angle: 60,
        origin: { x: 0 },
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      confetti({
        particleCount: confettiParticleCount,
        spread: 70,
        angle: 120,
        origin: { x: 1 },
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [isTransactionPending, previousTransactionPending, success, timerRef, from, transactionReceipt]);

  const onGoToEtherscan = () => {
    const url = buildEtherscanTransaction(transaction, currentNetwork.chainId);
    window.open(url, '_blank');
  };

  return (
    <Slide direction="up" in={shouldShow} mountOnEnter unmountOnExit>
      <StyledOverlay>
        <StyledTitleContainer>
          <svg width={0} height={0}>
            <linearGradient id="progressGradient" gradientTransform="rotate(90)">
              <stop offset="0%" stopColor={colors[mode].violet.violet200} />
              <stop offset="123.4%" stopColor={colors[mode].violet.violet800} />
            </linearGradient>
            <linearGradient id="successGradient" gradientTransform="rotate(135)">
              <stop offset="0%" stopColor={colors[mode].aqua.aqua200} />
              <stop offset="100%" stopColor={colors[mode].aqua.aqua800} />
            </linearGradient>
          </svg>
          <Typography variant="h6">
            {!success ? (
              <FormattedMessage
                description="transactionConfirmationInProgress"
                defaultMessage="Transaction in progress"
              />
            ) : (
              <FormattedMessage description="transactionConfirmationBalanceChanges" defaultMessage="Trade confirmed" />
            )}
          </Typography>
        </StyledTitleContainer>
        <StyledConfirmationContainer>
          <StyledBottomCircularProgress
            size={270}
            variant="determinate"
            value={100}
            thickness={4}
            sx={{ position: 'absolute' }}
          />
          <StyledTopCircularProgress
            size={270}
            variant="determinate"
            value={
              !success
                ? (1 - timer / (TIMES_PER_NETWORK[currentNetwork.chainId] || DEFAULT_TIME_PER_NETWORK)) * 100
                : 100
            }
            thickness={4}
            sx={{
              [`& .${circularProgressClasses.circle}`]: {
                strokeLinecap: 'round',
                stroke: !success ? "url('#progressGradient')" : "url('#successGradient')",
              },
            }}
          />
          <StyledProgressContent>
            <StyledTypography variant={!success && isTransactionPending && timer === 0 ? 'h4' : 'h2'}>
              {!success && isTransactionPending && timer > 0 && `${`0${minutes}`.slice(-2)}:${`0${seconds}`.slice(-2)}`}
              {!success && isTransactionPending && timer === 0 && (
                <FormattedMessage description="transactionConfirmationProcessing" defaultMessage="Processing" />
              )}
              {success && <StyledCheckCircleIcon fontSize="inherit" />}
            </StyledTypography>
          </StyledProgressContent>
        </StyledConfirmationContainer>

        <StyledButonContainer>
          <Button variant="outlined" color="primary" fullWidth onClick={onGoToEtherscan} size="large">
            {!success ? (
              <FormattedMessage description="transactionConfirmationViewExplorer" defaultMessage="View in explorer" />
            ) : (
              <FormattedMessage description="transactionConfirmationViewReceipt" defaultMessage="View receipt" />
            )}
          </Button>
          <Button variant="contained" color="secondary" onClick={handleNewTrade} fullWidth size="large">
            <FormattedMessage description="transactionConfirmationNewTrade" defaultMessage="New trade" />
          </Button>
        </StyledButonContainer>
      </StyledOverlay>
    </Slide>
  );
};

export default TransactionConfirmation;