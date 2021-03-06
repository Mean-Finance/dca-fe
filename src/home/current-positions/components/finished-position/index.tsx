import * as React from 'react';
import find from 'lodash/find';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from 'common/button';
import Typography from '@mui/material/Typography';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import TokenIcon from 'common/token-icon';
import { getTimeFrequencyLabel, sortTokens, calculateStale, STALE } from 'utils/parsing';
import { NetworkStruct, Position, Token } from 'types';
import { useHistory } from 'react-router-dom';
import { NETWORKS, POSITION_VERSION_2, POSITION_VERSION_3, STRING_SWAP_INTERVALS } from 'config/constants';
import useAvailablePairs from 'hooks/useAvailablePairs';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { BigNumber } from 'ethers';
import { emptyTokenWithAddress } from 'utils/currency';
import { buildEtherscanTransaction } from 'utils/etherscan';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from '@mui/material/Link';
import { getProtocolToken, getWrappedProtocolToken, PROTOCOL_TOKEN_ADDRESS } from 'mocks/tokens';
import useWalletService from 'hooks/useWalletService';

const StyledNetworkLogoContainer = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  border-radius: 30px;
  border: 3px solid #1b1923;
  width: 32px;
  height: 32px;
`;

const StyledCard = styled(Card)`
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-grow: 1;
  background: #292929;
  overflow: visible;
`;

const StyledCardContent = styled(CardContent)`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
`;

const StyledCardHeader = styled.div`
  display: flex;
  margin-bottom: 5px;
  flex-wrap: wrap;
`;

const StyledArrowRightContainer = styled.div`
  margin: 0 5px !important;
  font-size: 35px;
  display: flex;
`;

const StyledCardTitleHeader = styled.div`
  display: flex;
  align-items: center;
  margin-right: 10px;
  flex-grow: 1;
  *:not(:first-child) {
    margin-left: 4px;
    font-weight: 500;
  }
`;

const StyledDetailWrapper = styled.div<{ alignItems?: string }>`
  margin-bottom: 5px;
  display: flex;
  align-items: ${({ alignItems }) => alignItems || 'center'};
  justify-content: flex-start;
`;

const StyledCardFooterButton = styled(Button)`
  margin-top: 8px;
`;

const StyledFreqLeft = styled.div`
  display: flex;
  align-items: center;
  text-transform: uppercase;
`;

const StyledStale = styled.div`
  color: #cc6d00;
  display: flex;
  align-items: center;
  text-transform: uppercase;
`;

const StyledDeprecated = styled.div`
  color: #cc6d00;
  display: flex;
  align-items: center;
  text-transform: uppercase;
`;

const StyledFinished = styled.div`
  color: #33ac2e;
  display: flex;
  align-items: center;
  text-transform: uppercase;
`;

const StyledContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const StyledCallToActionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

interface PositionProp extends Omit<Position, 'from' | 'to'> {
  from: Token;
  to: Token;
}

interface ActivePositionProps {
  position: PositionProp;
  onWithdraw: (position: Position, useProtocolToken?: boolean) => void;
  onTerminate: (position: Position) => void;
  onReusePosition: (position: Position) => void;
  onMigrate: (position: Position) => void;
  disabled: boolean;
  hasSignSupport: boolean;
  network: NetworkStruct;
}

const ActivePosition = ({
  position,
  onWithdraw,
  onReusePosition,
  onTerminate,
  onMigrate,
  disabled,
  hasSignSupport,
  network,
}: ActivePositionProps) => {
  const { from, to, swapInterval, remainingLiquidity, remainingSwaps, pendingTransaction, toWithdraw, chainId } =
    position;
  const positionNetwork = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const supportedNetwork = find(NETWORKS, { chainId })!;
    return supportedNetwork;
  }, [chainId]);

  const isOnNetwork = network.chainId === positionNetwork.chainId;
  const availablePairs = useAvailablePairs();
  const protocolToken = getProtocolToken(positionNetwork.chainId);
  const history = useHistory();
  const walletService = useWalletService();

  const isPending = !!pendingTransaction;
  const wrappedProtocolToken = getWrappedProtocolToken(positionNetwork.chainId);
  const [token0, token1] = sortTokens(
    from.address === PROTOCOL_TOKEN_ADDRESS ? wrappedProtocolToken : from,
    to.address === PROTOCOL_TOKEN_ADDRESS ? wrappedProtocolToken : to
  );
  const pair = find(
    availablePairs,
    (findigPair) => findigPair.token0.address === token0.address && findigPair.token1.address === token1.address
  );

  const hasNoFunds = remainingLiquidity.lte(BigNumber.from(0));

  const isStale =
    calculateStale(
      pair?.lastExecutedAt || position.pairLastSwappedAt || 0,
      swapInterval,
      position.startedAt,
      pair?.swapInfo || position.pairNextSwapAvailableAt || '1'
    ) === STALE;

  const onViewDetails = () => {
    history.push(`/${chainId}/positions/${position.version}/${position.positionId}`);
  };

  const onChangeNetwork = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    walletService.changeNetwork(chainId);
  };

  const isOldVersion = position.version !== POSITION_VERSION_3;

  return (
    <StyledCard variant="outlined">
      {positionNetwork && (
        <StyledNetworkLogoContainer>
          <TokenIcon size="26px" token={emptyTokenWithAddress(positionNetwork.mainCurrency || '')} />
        </StyledNetworkLogoContainer>
      )}
      <StyledCardContent>
        <StyledContentContainer>
          <StyledCardHeader>
            <StyledCardTitleHeader>
              <TokenIcon token={from} size="27px" />
              <Typography variant="body1">{from.symbol}</Typography>
              <StyledArrowRightContainer>
                <ArrowRightAltIcon fontSize="inherit" />
              </StyledArrowRightContainer>
              <TokenIcon token={to} size="27px" />
              <Typography variant="body1">{to.symbol}</Typography>
            </StyledCardTitleHeader>
            {!isPending && !hasNoFunds && !isStale && !isOldVersion && (
              <StyledFreqLeft>
                <Typography variant="caption">
                  <FormattedMessage
                    description="days to finish"
                    defaultMessage="{type} left"
                    values={{
                      type: getTimeFrequencyLabel(swapInterval.toString(), remainingSwaps.toString()),
                    }}
                  />
                </Typography>
              </StyledFreqLeft>
            )}
            {!isPending && hasNoFunds && !isOldVersion && (
              <StyledFinished>
                <Typography variant="caption">
                  <FormattedMessage description="finishedPosition" defaultMessage="FINISHED" />
                </Typography>
              </StyledFinished>
            )}
            {!isPending && !hasNoFunds && isStale && !isOldVersion && (
              <StyledStale>
                <Typography variant="caption">
                  <FormattedMessage description="stale" defaultMessage="STALE" />
                </Typography>
              </StyledStale>
            )}
            {isOldVersion && (
              <StyledDeprecated>
                <Typography variant="caption">
                  <FormattedMessage description="deprecated" defaultMessage="DEPRECATED" />
                </Typography>
              </StyledDeprecated>
            )}
          </StyledCardHeader>
          <StyledDetailWrapper alignItems="flex-start">
            <Typography variant="body1" color="rgba(255, 255, 255, 0.5)">
              <FormattedMessage
                description="current remaining"
                defaultMessage="Frequency:"
                values={{
                  b: (chunks: React.ReactNode) => <b>{chunks}</b>,
                }}
              />
            </Typography>
            <Typography
              variant="body1"
              color={remainingLiquidity.gt(BigNumber.from(0)) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
              sx={{ marginLeft: '5px' }}
            >
              <FormattedMessage
                description="current remaining rate"
                defaultMessage="{frequency}"
                values={{
                  b: (chunks: React.ReactNode) => <b>{chunks}</b>,
                  frequency: STRING_SWAP_INTERVALS[swapInterval.toString() as keyof typeof STRING_SWAP_INTERVALS].every,
                }}
              />
            </Typography>
          </StyledDetailWrapper>
        </StyledContentContainer>
        <StyledCallToActionContainer>
          <StyledCardFooterButton
            variant={isPending ? 'contained' : 'outlined'}
            color={isPending ? 'pending' : 'default'}
            onClick={() => !isPending && onViewDetails()}
            fullWidth
          >
            {isPending ? (
              <Link
                href={buildEtherscanTransaction(pendingTransaction, positionNetwork.chainId)}
                target="_blank"
                rel="noreferrer"
                underline="none"
                color="inherit"
              >
                <Typography variant="body2" component="span">
                  <FormattedMessage description="pending transaction" defaultMessage="Pending transaction" />
                </Typography>
                <OpenInNewIcon style={{ fontSize: '1rem' }} />
              </Link>
            ) : (
              <Typography variant="body2">
                <FormattedMessage description="goToPosition" defaultMessage="Go to position" />
              </Typography>
            )}
          </StyledCardFooterButton>
          {position.version !== POSITION_VERSION_2 && (
            <>
              {(!isOnNetwork || disabled) && (
                <StyledCardFooterButton variant="contained" color="secondary" onClick={onChangeNetwork} fullWidth>
                  <Typography variant="body2">
                    <FormattedMessage
                      description="incorrect network"
                      defaultMessage="Switch to {network}"
                      values={{ network: positionNetwork.name }}
                    />
                  </Typography>
                </StyledCardFooterButton>
              )}
              {isOnNetwork && !disabled && (
                <>
                  {!isPending &&
                    toWithdraw.gt(BigNumber.from(0)) &&
                    hasSignSupport &&
                    position.to.address === PROTOCOL_TOKEN_ADDRESS && (
                      <StyledCardFooterButton
                        variant="contained"
                        color="secondary"
                        onClick={() => onWithdraw(position, true)}
                        fullWidth
                        disabled={disabled || !isOnNetwork}
                      >
                        <Typography variant="body2">
                          <FormattedMessage
                            description="withdraw"
                            defaultMessage="Withdraw {protocolToken}"
                            values={{ protocolToken: protocolToken.symbol }}
                          />
                        </Typography>
                      </StyledCardFooterButton>
                    )}
                  {!isPending && toWithdraw.gt(BigNumber.from(0)) && (
                    <StyledCardFooterButton
                      variant="contained"
                      color="secondary"
                      onClick={() => onWithdraw(position, false)}
                      disabled={disabled || !isOnNetwork}
                      fullWidth
                    >
                      <Typography variant="body2">
                        <FormattedMessage
                          description="withdraw"
                          defaultMessage="Withdraw {wrappedProtocolToken}"
                          values={{
                            wrappedProtocolToken:
                              position.to.address === PROTOCOL_TOKEN_ADDRESS && hasSignSupport
                                ? wrappedProtocolToken.symbol
                                : '',
                          }}
                        />
                      </Typography>
                    </StyledCardFooterButton>
                  )}
                  {!isPending && remainingSwaps.lte(BigNumber.from(0)) && toWithdraw.lte(BigNumber.from(0)) && (
                    <StyledCardFooterButton
                      variant="contained"
                      color="secondary"
                      onClick={() => onReusePosition(position)}
                      disabled={disabled || !isOnNetwork}
                      fullWidth
                    >
                      <Typography variant="body2">
                        <FormattedMessage description="reusePosition" defaultMessage="Reuse position" />
                      </Typography>
                    </StyledCardFooterButton>
                  )}
                </>
              )}
            </>
          )}
          {position.version === POSITION_VERSION_2 && (
            <>
              {isPending && (
                <StyledCardFooterButton variant="contained" color="pending" fullWidth>
                  <Link
                    href={buildEtherscanTransaction(pendingTransaction, positionNetwork.chainId)}
                    target="_blank"
                    rel="noreferrer"
                    underline="none"
                    color="inherit"
                  >
                    <Typography variant="body2" component="span">
                      <FormattedMessage description="pending transaction" defaultMessage="Pending transaction" />
                    </Typography>
                    <OpenInNewIcon style={{ fontSize: '1rem' }} />
                  </Link>
                </StyledCardFooterButton>
              )}
              {!isPending && hasSignSupport && remainingSwaps.gt(BigNumber.from(0)) && (
                <StyledCardFooterButton
                  variant="contained"
                  color="migrate"
                  onClick={() => onMigrate(position)}
                  fullWidth
                  disabled={disabled || !isOnNetwork}
                >
                  <Typography variant="body2">
                    <FormattedMessage description="migratePosition" defaultMessage="Migrate position" />
                  </Typography>
                </StyledCardFooterButton>
              )}
              {!isPending && (toWithdraw.gt(BigNumber.from(0)) || remainingLiquidity.gt(BigNumber.from(0))) && (
                <StyledCardFooterButton
                  variant="contained"
                  color="error"
                  onClick={() => onTerminate(position)}
                  fullWidth
                  disabled={disabled || !isOnNetwork}
                >
                  <Typography variant="body2">
                    <FormattedMessage description="terminate" defaultMessage="Terminate" />
                  </Typography>
                </StyledCardFooterButton>
              )}
            </>
          )}
        </StyledCallToActionContainer>
      </StyledCardContent>
    </StyledCard>
  );
};
export default ActivePosition;
