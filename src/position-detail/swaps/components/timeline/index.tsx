import React, { useState } from 'react';
import { BigNumber } from 'ethers';
import styled from 'styled-components';
import orderBy from 'lodash/orderBy';
import Grid from '@mui/material/Grid';
import { FormattedMessage } from 'react-intl';
import Typography from '@mui/material/Typography';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CreatedIcon from '@mui/icons-material/NewReleases';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { ActionState, FullPosition } from 'types';
import { DateTime } from 'luxon';
import { formatCurrencyAmount } from 'utils/currency';
import {
  COMPANION_ADDRESS,
  POSITION_ACTIONS,
  POSITION_VERSION_3,
  STABLE_COINS,
  STRING_PERMISSIONS,
} from 'config/constants';
import { getFrequencyLabel } from 'utils/parsing';
import { buildEtherscanAddress } from 'utils/etherscan';
import Link from '@mui/material/Link';
import useCurrentNetwork from 'hooks/useCurrentNetwork';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import Address from 'common/address';
import useUsdPrice from 'hooks/useUsdPrice';
import { withStyles } from '@mui/styles';
import { Theme } from '@mui/material';
import { getWrappedProtocolToken, PROTOCOL_TOKEN_ADDRESS } from 'mocks/tokens';

const DarkTooltip = withStyles((theme: Theme) => ({
  tooltip: {
    // backgroundColor: theme.palette.primary.dark,
    // color: theme.palette.common.white,
    boxShadow: theme.shadows[1],
    fontSize: 11,
  },
}))(Tooltip);

const StyledChip = styled(Chip)`
  margin: 0px 5px;
`;

const StyledHelpOutlineIcon = styled(HelpOutlineIcon)`
  margin-left: 3px;
  font-size: 15px;
`;

const StyledLink = styled(Link)`
  ${({ theme }) => `
    color: ${theme.palette.mode === 'light' ? '#3f51b5' : '#8699ff'};
  `}
  margin: 0px 5px;
`;

const StyledTimeline = styled(Grid)`
  position: relative;
  padding: 0px 0px 0px 21px;
  &:before {
    content: '';
    position: absolute;
    left: 21px;
    top: 5px;
    width: 4px;
    bottom: 0;
    border-left: 3px dashed #dce2f9;
  }
`;

const StyledTimelineContainer = styled(Grid)`
  position: relative;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  padding-left: 16px;
  &:first-child {
    :before {
      content: '';
      position: absolute;
      bottom: calc(50% + 21px);
      width: 4px;
      left: 0;
      top: 0;
      background: #202020;
    }
  }
  &:last-child {
    margin-bottom: 0px;
    :before {
      content: '';
      position: absolute;
      top: calc(50% - 21px);
      width: 4px;
      left: 0;
      bottom: 0;
      background: #202020;
    }
  }
`;

const StyledCenteredGrid = styled(Grid)`
  display: flex;
  align-items: center;
`;

const StyledTimelineIcon = styled.div`
  position: absolute;
  left: -21px;
  top: calc(50% - 21px);
  width: 43px;
  height: 43px;
  border-radius: 50%;
  text-align: center;
  border: 1px solid #dce2f9;
  background: #202020;

  i {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  svg {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
`;

const StyledTimelineContent = styled.div`
  padding: 0px;
  position: relative;
  text-align: start;
  padding: 0px 10px 0px 22px;
  overflow-wrap: anywhere;
  flex-grow: 1;
`;

const StyledTimelineContentText = styled(Grid)``;

const StyledTimelineContentTitle = styled(Grid)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledTitleMainText = styled(Typography)`
  color: rgba(255, 255, 255, 0.5);
`;

interface PositionTimelineProps {
  position: FullPosition;
  filter: 0 | 1 | 2 | 3; // 0 - all; 1 - swaps; 2 - modifications; 3 - withdraws
}

const buildSwappedItem = (positionState: ActionState, position: FullPosition, chainId: number) => ({
  icon: <CompareArrowsIcon />,
  content: () => {
    const [toCurrentPrice, isLoadingToCurrentPrice] = useUsdPrice(position.to, BigNumber.from(positionState.swapped));
    const [toPrice, isLoadingToPrice] = useUsdPrice(
      position.to,
      BigNumber.from(positionState.swapped),
      positionState.createdAtTimestamp
    );
    const [fromCurrentPrice, isLoadingFromCurrentPrice] = useUsdPrice(
      position.from,
      BigNumber.from(positionState.rate)
    );
    const [fromPrice, isLoadingFromPrice] = useUsdPrice(
      position.from,
      BigNumber.from(positionState.rate),
      positionState.createdAtTimestamp
    );

    const showToPrices =
      !STABLE_COINS.includes(position.to.symbol) &&
      !isLoadingToPrice &&
      !!toPrice &&
      !isLoadingToCurrentPrice &&
      !!toCurrentPrice;
    const showFromPrices =
      !STABLE_COINS.includes(position.from.symbol) &&
      !isLoadingFromPrice &&
      !!fromPrice &&
      !isLoadingFromCurrentPrice &&
      !!fromCurrentPrice;
    const [showToCurrentPrice, setShouldShowToCurrentPrice] = useState(true);
    const [showFromCurrentPrice, setShouldShowFromCurrentPrice] = useState(true);
    const wrappedProtocolToken = getWrappedProtocolToken(chainId);

    let tokenFrom = STABLE_COINS.includes(position.to.symbol) ? position.from : position.to;
    let tokenTo = STABLE_COINS.includes(position.to.symbol) ? position.to : position.from;
    tokenFrom =
      tokenFrom.address === PROTOCOL_TOKEN_ADDRESS ? { ...wrappedProtocolToken, symbol: tokenFrom.symbol } : tokenFrom;
    tokenTo =
      tokenTo.address === PROTOCOL_TOKEN_ADDRESS ? { ...wrappedProtocolToken, symbol: tokenFrom.symbol } : tokenTo;

    const TooltipMessage = (
      <FormattedMessage
        description="pairSwapDetails"
        defaultMessage="1 {from} = {currencySymbol}{swapRate} {to}"
        values={{
          from: tokenFrom.symbol,
          to: STABLE_COINS.includes(tokenTo.symbol) ? 'USD' : tokenTo.symbol,
          swapRate:
            position.pair.tokenA.address === tokenFrom.address
              ? formatCurrencyAmount(BigNumber.from(positionState.ratePerUnitAToBWithFee), tokenTo)
              : formatCurrencyAmount(BigNumber.from(positionState.ratePerUnitBToAWithFee), tokenFrom),
          currencySymbol: STABLE_COINS.includes(tokenTo.symbol) ? '$' : '',
        }}
      />
    );
    return (
      <>
        <StyledCenteredGrid item xs={12}>
          <Typography
            variant="body1"
            component="p"
            style={{ display: 'flex', alignItems: 'center', whiteSpace: 'break-spaces' }}
          >
            <StyledTitleMainText variant="body1">
              <FormattedMessage description="pairSwapDetails" defaultMessage="Swapped:" />
            </StyledTitleMainText>
            {` ${formatCurrencyAmount(BigNumber.from(positionState.rate), position.from)} ${position.from.symbol} `}
            {showFromPrices && (
              <DarkTooltip
                title={
                  showFromCurrentPrice
                    ? 'Displaying current value. Click to show value on day of withdrawal'
                    : 'Estimated value on day of swap'
                }
                arrow
                placement="top"
              >
                <StyledChip
                  onClick={() => setShouldShowFromCurrentPrice(!showFromCurrentPrice)}
                  variant="outlined"
                  size="small"
                  label={
                    <FormattedMessage
                      description="pairSwapDetailsFromPrice"
                      defaultMessage="{fromPrice} USD"
                      values={{
                        fromPrice: showFromCurrentPrice ? fromCurrentPrice?.toFixed(2) : fromPrice?.toFixed(2),
                      }}
                    />
                  }
                />
              </DarkTooltip>
            )}
            <FormattedMessage
              description="pairSwapDetailsFor"
              defaultMessage="for {result} {to}"
              values={{
                result: formatCurrencyAmount(BigNumber.from(positionState.swapped), position.to),
                to: position.to.symbol,
              }}
            />
            {showToPrices && (
              <DarkTooltip
                title={
                  showToCurrentPrice
                    ? 'Displaying current value. Click to show value on day of withdrawal'
                    : 'Estimated value on day of swap'
                }
                arrow
                placement="top"
              >
                <StyledChip
                  onClick={() => setShouldShowToCurrentPrice(!showToCurrentPrice)}
                  variant="outlined"
                  size="small"
                  label={
                    <FormattedMessage
                      description="pairSwapDetailsToPrice"
                      defaultMessage="{toPrice} USD"
                      values={{
                        toPrice: showToCurrentPrice ? toCurrentPrice?.toFixed(2) : toPrice?.toFixed(2),
                      }}
                    />
                  }
                />
              </DarkTooltip>
            )}
          </Typography>
          <Tooltip title={TooltipMessage} arrow placement="top">
            <StyledHelpOutlineIcon fontSize="inherit" />
          </Tooltip>
        </StyledCenteredGrid>
      </>
    );
  },
  title: <FormattedMessage description="timelineTypeSwap" defaultMessage="Swap Executed" />,
  toOrder: parseInt(positionState.createdAtBlock, 10),
  time: parseInt(positionState.createdAtTimestamp, 10),
});

const buildCreatedItem = (positionState: ActionState, position: FullPosition) => ({
  icon: <CreatedIcon />,
  content: () => (
    <>
      <Grid item xs={12}>
        <Typography
          variant="body1"
          component="p"
          style={{ display: 'flex', alignItems: 'center', whiteSpace: 'break-spaces' }}
        >
          <StyledTitleMainText variant="body1">
            <FormattedMessage
              description="positionCreatedRate"
              defaultMessage="Rate:"
              values={{
                rate: formatCurrencyAmount(BigNumber.from(positionState.rate), position.from),
                from: position.from.symbol,
              }}
            />
          </StyledTitleMainText>
          {` ${formatCurrencyAmount(BigNumber.from(positionState.rate), position.from)} ${position.from.symbol}`}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography
          variant="body1"
          component="p"
          style={{ display: 'flex', alignItems: 'center', whiteSpace: 'break-spaces' }}
        >
          <StyledTitleMainText variant="body1">
            <FormattedMessage description="positionCreatedSwaps" defaultMessage="Set to run for:" />
          </StyledTitleMainText>
          {` ${getFrequencyLabel(position.swapInterval.interval, positionState.remainingSwaps)}`}
        </Typography>
      </Grid>
    </>
  ),
  title: <FormattedMessage description="timelineTypeCreated" defaultMessage="Position Created" />,
  toOrder: parseInt(positionState.createdAtBlock, 10),
  time: parseInt(positionState.createdAtTimestamp, 10),
});

const buildTransferedItem = (positionState: ActionState, position: FullPosition, chainId: number) => ({
  icon: <CardGiftcardIcon />,
  content: () => (
    <>
      <Grid item xs={12}>
        <Typography
          variant="body1"
          component="p"
          style={{ display: 'flex', alignItems: 'center', whiteSpace: 'break-spaces' }}
        >
          <StyledTitleMainText variant="body1">
            <FormattedMessage description="transferedFrom" defaultMessage="Transfered from:" />
          </StyledTitleMainText>
          <StyledLink href={buildEtherscanAddress(positionState.from, chainId)} target="_blank" rel="noreferrer">
            <Address address={positionState.from} />
            <OpenInNewIcon style={{ fontSize: '1rem' }} />
          </StyledLink>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography
          variant="body1"
          component="p"
          style={{ display: 'flex', alignItems: 'center', whiteSpace: 'break-spaces' }}
        >
          <StyledTitleMainText variant="body1">
            <FormattedMessage description="transferedTo" defaultMessage="Transfered to:" />
          </StyledTitleMainText>
          <StyledLink href={buildEtherscanAddress(positionState.to, chainId)} target="_blank" rel="noreferrer">
            <Address address={positionState.to} />
            <OpenInNewIcon style={{ fontSize: '1rem' }} />
          </StyledLink>
        </Typography>
      </Grid>
    </>
  ),
  title: <FormattedMessage description="timelineTypeTransfered" defaultMessage="Position Transfered" />,
  toOrder: parseInt(positionState.createdAtBlock, 10),
  time: parseInt(positionState.createdAtTimestamp, 10),
});

const buildPermissionsModifiedItem = (positionState: ActionState, position: FullPosition, chainId: number) => ({
  icon: <FingerprintIcon />,
  content: () => (
    <>
      <Grid item xs={12}>
        {positionState.permissions.map((permission) => (
          <Typography variant="body1">
            {permission.permissions.length ? (
              <>
                <StyledLink href={buildEtherscanAddress(permission.operator, chainId)} target="_blank" rel="noreferrer">
                  {permission.operator.toLowerCase() ===
                  COMPANION_ADDRESS[POSITION_VERSION_3][chainId].toLowerCase() ? (
                    'Mean Finance Companion'
                  ) : (
                    <Address address={permission.operator} />
                  )}
                  <OpenInNewIcon style={{ fontSize: '1rem' }} />
                </StyledLink>
                <FormattedMessage
                  description="positionPermissionsModified only"
                  defaultMessage="will only be able to"
                />
                {permission.permissions.map(
                  (permissionString, index) =>
                    ` ${
                      index === permission.permissions.length - 1 && permission.permissions.length > 1 ? 'and ' : ''
                    }${STRING_PERMISSIONS[permissionString].toLowerCase()}${
                      index !== permission.permissions.length - 1 && index !== permission.permissions.length - 2
                        ? ','
                        : ''
                    } `
                )}
                <FormattedMessage
                  description="positionPermissionsModified your position"
                  defaultMessage="your position"
                />
              </>
            ) : (
              <>
                <FormattedMessage
                  description="positionPermissionsModified all"
                  defaultMessage="Removed all permissions for"
                />
                <StyledLink href={buildEtherscanAddress(permission.operator, chainId)} target="_blank" rel="noreferrer">
                  {permission.operator.toLowerCase() ===
                  COMPANION_ADDRESS[POSITION_VERSION_3][chainId].toLowerCase() ? (
                    'Mean Finance Companion'
                  ) : (
                    <Address address={permission.operator} />
                  )}
                  <OpenInNewIcon style={{ fontSize: '1rem' }} />
                </StyledLink>
              </>
            )}
          </Typography>
        ))}
      </Grid>
    </>
  ),
  title: <FormattedMessage description="timelineTypeTransfered" defaultMessage="Position permissions modified" />,
  toOrder: parseInt(positionState.createdAtBlock, 10),
  time: parseInt(positionState.createdAtTimestamp, 10),
});

const buildModifiedRateItem = (positionState: ActionState, position: FullPosition) => ({
  icon: <SettingsIcon />,
  content: () => (
    <>
      <Grid item xs={12}>
        <Typography variant="body1">
          <FormattedMessage
            description="positionModifiedRate"
            defaultMessage="{increaseDecrease} rate from {oldRate} {from} to {rate} {from}"
            values={{
              increaseDecrease: BigNumber.from(positionState.oldRate).lt(BigNumber.from(positionState.rate))
                ? 'Increased'
                : 'Decreased',
              rate: formatCurrencyAmount(BigNumber.from(positionState.rate), position.from),
              oldRate: formatCurrencyAmount(BigNumber.from(positionState.oldRate), position.from),
              from: position.from.symbol,
            }}
          />
        </Typography>
      </Grid>
    </>
  ),
  title: <FormattedMessage description="timelineTypeModified" defaultMessage="Rate Modified" />,
  toOrder: parseInt(positionState.createdAtBlock, 10),
  time: parseInt(positionState.createdAtTimestamp, 10),
});

const buildModifiedDurationItem = (positionState: ActionState, position: FullPosition) => ({
  icon: <SettingsIcon />,
  content: () => (
    <>
      <Grid item xs={12}>
        <Typography variant="body1">
          <FormattedMessage
            description="positionModifiedSwaps"
            defaultMessage="{increaseDecrease} duration to run for {frequency} from {oldFrequency}"
            values={{
              increaseDecrease: BigNumber.from(positionState.oldRemainingSwaps).lt(
                BigNumber.from(positionState.remainingSwaps)
              )
                ? 'Increased'
                : 'Decreased',
              frequency: getFrequencyLabel(position.swapInterval.interval, positionState.remainingSwaps),
              oldFrequency: getFrequencyLabel(position.swapInterval.interval, positionState.oldRemainingSwaps),
            }}
          />
        </Typography>
      </Grid>
    </>
  ),
  title: <FormattedMessage description="timelineTypeModified" defaultMessage="Changed duration" />,
  toOrder: parseInt(positionState.createdAtBlock, 10),
  time: parseInt(positionState.createdAtTimestamp, 10),
});

const buildModifiedRateAndDurationItem = (positionState: ActionState, position: FullPosition) => ({
  icon: <SettingsIcon />,
  content: () => (
    <>
      <Grid item xs={12}>
        <Typography variant="body1">
          <FormattedMessage
            description="positionModifiedRate"
            defaultMessage="{increaseDecrease} rate from {oldRate} {from} to {rate} {from}"
            values={{
              increaseDecrease: BigNumber.from(positionState.oldRate).lt(BigNumber.from(positionState.rate))
                ? 'Increased'
                : 'Decreased',
              rate: formatCurrencyAmount(BigNumber.from(positionState.rate), position.from),
              oldRate: formatCurrencyAmount(BigNumber.from(positionState.oldRate), position.from),
              from: position.from.symbol,
            }}
          />
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body1">
          <FormattedMessage
            description="positionModifiedSwaps"
            defaultMessage="{increaseDecrease} duration to run for {frequency} from {oldFrequency}"
            values={{
              increaseDecrease: BigNumber.from(positionState.oldRemainingSwaps).lt(
                BigNumber.from(positionState.remainingSwaps)
              )
                ? 'Increased'
                : 'Decreased',
              frequency: getFrequencyLabel(position.swapInterval.interval, positionState.remainingSwaps),
              oldFrequency: getFrequencyLabel(position.swapInterval.interval, positionState.oldRemainingSwaps),
            }}
          />
        </Typography>
      </Grid>
    </>
  ),
  title: <FormattedMessage description="timelineTypeModified" defaultMessage="Position Modified" />,
  toOrder: parseInt(positionState.createdAtBlock, 10),
  time: parseInt(positionState.createdAtTimestamp, 10),
});

const buildWithdrawnItem = (positionState: ActionState, position: FullPosition) => ({
  icon: <OpenInNewIcon />,
  content: () => {
    const [toCurrentPrice, isLoadingToCurrentPrice] = useUsdPrice(position.to, BigNumber.from(positionState.withdrawn));
    const [toPrice, isLoadingToPrice] = useUsdPrice(
      position.to,
      BigNumber.from(positionState.withdrawn),
      positionState.createdAtTimestamp
    );

    const showPrices =
      !STABLE_COINS.includes(position.to.symbol) &&
      !isLoadingToPrice &&
      !!toPrice &&
      !isLoadingToCurrentPrice &&
      !!toCurrentPrice;
    const [showCurrentPrice, setShouldShowCurrentPrice] = useState(true);

    return (
      <>
        <Grid item xs={12}>
          <Typography variant="body1" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'break-spaces' }}>
            <FormattedMessage
              description="positionWithdrawn"
              defaultMessage="Withdraw {withdraw} {to}"
              values={{
                withdraw: formatCurrencyAmount(BigNumber.from(positionState.withdrawn), position.to),
                to: position.to.symbol,
                showToPrice: showPrices,
                toPrice: toPrice?.toFixed(2),
              }}
            />
            {showPrices && (
              <DarkTooltip
                title={
                  showCurrentPrice
                    ? 'Displaying current value. Click to show value on day of withdrawal'
                    : 'Estimated value on day of withdrawal'
                }
                arrow
                placement="top"
              >
                <StyledChip
                  onClick={() => setShouldShowCurrentPrice(!showCurrentPrice)}
                  variant="outlined"
                  size="small"
                  label={
                    <FormattedMessage
                      description="positionWithdrawnPrice"
                      defaultMessage="{toPrice} USD"
                      values={{
                        toPrice: showCurrentPrice ? toCurrentPrice?.toFixed(2) : toPrice?.toFixed(2),
                      }}
                    />
                  }
                />
              </DarkTooltip>
            )}
            <FormattedMessage description="positionWithdrawnSecond" defaultMessage=" from position" />
          </Typography>
        </Grid>
      </>
    );
  },
  title: <FormattedMessage description="timelineTypeWithdrawn" defaultMessage="Position Withdrawn" />,
  toOrder: parseInt(positionState.createdAtBlock, 10),
  time: parseInt(positionState.createdAtTimestamp, 10),
});

const buildTerminatedItem = (positionState: ActionState) => ({
  icon: <DeleteSweepIcon />,
  content: () => <></>,
  title: <FormattedMessage description="timelineTypeWithdrawn" defaultMessage="Position Terminated" />,
  toOrder: parseInt(positionState.createdAtBlock, 10),
  time: parseInt(positionState.createdAtTimestamp, 10),
});

const MESSAGE_MAP = {
  [POSITION_ACTIONS.CREATED]: buildCreatedItem,
  [POSITION_ACTIONS.MODIFIED_DURATION]: buildModifiedDurationItem,
  [POSITION_ACTIONS.MODIFIED_RATE]: buildModifiedRateItem,
  [POSITION_ACTIONS.MODIFIED_RATE_AND_DURATION]: buildModifiedRateAndDurationItem,
  [POSITION_ACTIONS.SWAPPED]: buildSwappedItem,
  [POSITION_ACTIONS.WITHDREW]: buildWithdrawnItem,
  [POSITION_ACTIONS.TERMINATED]: buildTerminatedItem,
  [POSITION_ACTIONS.TRANSFERED]: buildTransferedItem,
  [POSITION_ACTIONS.PERMISSIONS_MODIFIED]: buildPermissionsModifiedItem,
};

const FILTERS = {
  0: [
    POSITION_ACTIONS.CREATED,
    POSITION_ACTIONS.MODIFIED_DURATION,
    POSITION_ACTIONS.MODIFIED_RATE,
    POSITION_ACTIONS.MODIFIED_RATE_AND_DURATION,
    POSITION_ACTIONS.SWAPPED,
    POSITION_ACTIONS.WITHDREW,
    POSITION_ACTIONS.TRANSFERED,
    POSITION_ACTIONS.TERMINATED,
    POSITION_ACTIONS.PERMISSIONS_MODIFIED,
  ],
  1: [POSITION_ACTIONS.SWAPPED],
  2: [
    POSITION_ACTIONS.CREATED,
    POSITION_ACTIONS.MODIFIED_DURATION,
    POSITION_ACTIONS.MODIFIED_RATE,
    POSITION_ACTIONS.MODIFIED_RATE_AND_DURATION,
    POSITION_ACTIONS.TRANSFERED,
    POSITION_ACTIONS.TERMINATED,
    POSITION_ACTIONS.PERMISSIONS_MODIFIED,
  ],
  3: [POSITION_ACTIONS.WITHDREW],
};

const PositionTimeline = ({ position, filter }: PositionTimelineProps) => {
  let history = [];
  const currentNetwork = useCurrentNetwork();

  const mappedPositionHistory = position.history
    .filter((positionState) => FILTERS[filter].includes(positionState.action))
    .map((positionState) => MESSAGE_MAP[positionState.action](positionState, position, currentNetwork.chainId));

  history = orderBy(mappedPositionHistory, ['toOrder'], ['desc']);

  return (
    <StyledTimeline container>
      {history.map((historyItem) => (
        <StyledTimelineContainer item xs={12} key={historyItem.time}>
          <StyledTimelineIcon>{historyItem.icon}</StyledTimelineIcon>
          <StyledTimelineContent>
            <Grid container>
              <StyledTimelineContentTitle item xs={12}>
                <Typography variant="body1" fontWeight={500}>
                  {historyItem.title}
                </Typography>
                <Tooltip
                  title={DateTime.fromSeconds(historyItem.time).toLocaleString(DateTime.DATETIME_FULL)}
                  arrow
                  placement="top"
                >
                  <StyledTitleMainText variant="body2">
                    {DateTime.fromSeconds(historyItem.time).toRelative()}
                  </StyledTitleMainText>
                </Tooltip>
              </StyledTimelineContentTitle>
              <Grid item xs={12}>
                <StyledTimelineContentText container>
                  <historyItem.content />
                </StyledTimelineContentText>
              </Grid>
            </Grid>
          </StyledTimelineContent>
        </StyledTimelineContainer>
      ))}
    </StyledTimeline>
  );
};
export default PositionTimeline;
