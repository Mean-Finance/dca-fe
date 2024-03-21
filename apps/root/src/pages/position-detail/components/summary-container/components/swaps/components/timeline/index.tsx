import React, { useState } from 'react';

import styled from 'styled-components';
import orderBy from 'lodash/orderBy';
import {
  Grid,
  Link,
  Typography,
  Tooltip,
  RepeatIcon,
  OpenInNewIcon,
  SettingsIcon,
  DeleteSweepIcon,
  CardGiftcardIcon,
  colors,
  ContainerBox,
  ChartSquareIcon,
  ArrowRightIcon,
  WalletMoneyIcon,
} from 'ui-library';
import { FormattedMessage, defineMessage, useIntl } from 'react-intl';
import {
  DCAPositionCreatedAction,
  DCAPositionModifiedAction,
  DCAPositionSwappedAction,
  DCAPositionTerminatedAction,
  DCAPositionTransferredAction,
  DCAPositionWithdrawnAction,
  Position,
  PositionWithHistory,
} from '@types';
import { DateTime } from 'luxon';
import { formatCurrencyAmount, parseNumberUsdPriceToBigInt, parseUsdPrice } from '@common/utils/currency';
import { getTimeFrequencyLabel, usdFormatter } from '@common/utils/parsing';
import { buildEtherscanAddress, buildEtherscanTransaction } from '@common/utils/etherscan';
import Address from '@common/components/address';
import { ActionTypeAction } from '@mean-finance/sdk';
import { usePositionPrices } from '@state/position-details/hooks';
import { compact } from 'lodash';
import TokenIcon from '@common/components/token-icon';
import { SPACING } from 'ui-library/src/theme/constants';

const StyledLink = styled(Link)<{ $isFirst?: boolean }>`
  margin: ${({ $isFirst }) => ($isFirst ? '0px 5px 0px 0px' : '0px 5px')};
  display: flex;
`;

const StyledTimeline = styled(ContainerBox)`
  ${({
    theme: {
      palette: { mode },
      spacing,
    },
  }) => `
    position: relative;
    padding: 0px 0px 0px ${spacing(6)};
    &:before {
      content: '';
      position: absolute;
      left: ${spacing(6)};
      top: 5px;
      width: 4px;
      bottom: ${spacing(15)};
      border-left: 3px dashed ${colors[mode].border.border1};
    }
  `}
`;

const StyledTimelineContainer = styled(ContainerBox)`
  ${({ theme: { spacing } }) => `
  position: relative;
  margin-bottom: ${spacing(6)};
  `}
`;

const StyledTitleEnd = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const StyledTimelineIcon = styled.div`
  ${({
    theme: {
      palette: { mode },
      spacing,
    },
  }) => `
    position: absolute;
    color: ${colors[mode].accent.accent600};
    left: -${spacing(7.5)};
    top: 0px;
    width: ${spacing(15)};
    height: ${spacing(15)};
    border-radius: 50%;
    text-align: center;
    border: 1px solid ${colors[mode].border.border1};
    background: ${colors[mode].background.secondary};

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
  `}
`;

const StyledTimelineContent = styled.div`
  ${({ theme: { spacing } }) => `
    padding: 0px 0px 0px ${spacing(13.5)};
  `}
  position: relative;
  text-align: start;
  overflow-wrap: anywhere;
  flex-grow: 1;
`;

const StyledTimelineContentTitle = styled(Grid)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledTitleMainText = styled(Typography)``;

interface PositionTimelineProps {
  position: PositionWithHistory;
  filter: 0 | 1 | 2 | 3; // 0 - all; 1 - swaps; 2 - modifications; 3 - withdraws
}

const currentPriceMessage = defineMessage({
  defaultMessage: 'Displaying current value. Click to show value on day of the event',
});
const prevPriceMessage = defineMessage({ defaultMessage: 'Estimated value on day of the event' });

const buildSwappedItem = (positionState: DCAPositionSwappedAction, position: Position) => ({
  icon: <RepeatIcon size={SPACING(6)} color="inherit" />,
  content: () => {
    const intl = useIntl();
    const { swapped, rate: baseRate, generatedByYield, tokenA, tokenB } = positionState;
    const yieldFrom = generatedByYield?.rate;
    const rate = baseRate - (yieldFrom || 0n);
    const to =
      position.to.address === tokenA.address
        ? {
            ...tokenA,
            ...position.to,
            price: tokenA.price,
          }
        : {
            ...tokenB,
            ...position.to,
            price: tokenB.price,
          };
    const from =
      position.from.address === tokenA.address
        ? {
            ...tokenA,
            ...position.from,
            price: tokenA.price,
          }
        : {
            ...tokenB,
            ...position.from,
            price: tokenB.price,
          };

    const { price: oldToPrice } = to;
    const { price: oldFromPrice } = from;
    const [showToCurrentPrice, setShouldShowToCurrentPrice] = useState(true);
    const [showFromCurrentPrice, setShouldShowFromCurrentPrice] = useState(true);
    const [showFromYieldCurrentPrice, setShouldShowFromYieldCurrentPrice] = useState(true);

    const fromUsd = parseUsdPrice(
      from,
      rate,
      parseNumberUsdPriceToBigInt(showFromCurrentPrice ? position.from.price : oldFromPrice)
    );
    const toUsd = parseUsdPrice(
      to,
      swapped,
      parseNumberUsdPriceToBigInt(showToCurrentPrice ? position.to.price : oldToPrice)
    );
    const fromYieldUsd = parseUsdPrice(
      from,
      yieldFrom,
      parseNumberUsdPriceToBigInt(showFromYieldCurrentPrice ? position.from.price : oldFromPrice)
    );

    return (
      <>
        <ContainerBox flexDirection="column">
          <Typography
            variant="bodySmall"
            fontWeight={500}
            color={({ palette: { mode } }) => colors[mode].typography.typo3}
          >
            <FormattedMessage description="positionSwapSwapped" defaultMessage="Swapped" />
          </Typography>
          <ContainerBox alignItems="center" gap={2}>
            <TokenIcon token={position.from} size={5} />
            <ContainerBox flexDirection="column">
              <ContainerBox gap={1}>
                <Typography
                  variant="body"
                  fontWeight={700}
                  color={({ palette: { mode } }) => colors[mode].typography.typo2}
                >
                  {formatCurrencyAmount(rate, position.from)}
                </Typography>
                {!!fromUsd && (
                  <Tooltip
                    title={intl.formatMessage(showFromCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                    arrow
                    placement="top"
                  >
                    <Typography
                      variant="body"
                      color={({ palette: { mode } }) => colors[mode].typography.typo3}
                      onClick={() => setShouldShowFromCurrentPrice(!showFromCurrentPrice)}
                    >
                      (${fromUsd})
                    </Typography>
                  </Tooltip>
                )}
              </ContainerBox>
              {!!yieldFrom && (
                <ContainerBox gap={1}>
                  <Typography variant="body" color={({ palette: { mode } }) => colors[mode].typography.typo2}>
                    <FormattedMessage defaultMessage="+ yield" description="plusYield" />
                    {` `}
                    {formatCurrencyAmount(yieldFrom, position.from)}
                  </Typography>
                  {!!fromYieldUsd && (
                    <Tooltip
                      title={intl.formatMessage(showFromYieldCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                      arrow
                      placement="top"
                    >
                      <Typography
                        variant="body"
                        color={({ palette: { mode } }) => colors[mode].typography.typo3}
                        onClick={() => setShouldShowFromYieldCurrentPrice(!showFromYieldCurrentPrice)}
                      >
                        (${fromYieldUsd})
                      </Typography>
                    </Tooltip>
                  )}
                </ContainerBox>
              )}
            </ContainerBox>
          </ContainerBox>
        </ContainerBox>
        <ContainerBox flexDirection="column">
          <Typography
            variant="bodySmall"
            fontWeight={500}
            color={({ palette: { mode } }) => colors[mode].typography.typo3}
          >
            <FormattedMessage description="positionSwapReceived" defaultMessage="Received" />
          </Typography>
          <ContainerBox alignItems="center" gap={2}>
            <TokenIcon token={position.to} size={5} />
            <ContainerBox>
              <ContainerBox gap={1}>
                <Typography
                  variant="body"
                  fontWeight={700}
                  color={({ palette: { mode } }) => colors[mode].typography.typo2}
                >
                  {formatCurrencyAmount(swapped, position.to)}
                </Typography>
                {!!toUsd && (
                  <Tooltip
                    title={intl.formatMessage(showToCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                    arrow
                    placement="top"
                  >
                    <Typography
                      variant="body"
                      color={({ palette: { mode } }) => colors[mode].typography.typo3}
                      onClick={() => setShouldShowToCurrentPrice(!showToCurrentPrice)}
                    >
                      (${toUsd})
                    </Typography>
                  </Tooltip>
                )}
              </ContainerBox>
            </ContainerBox>
          </ContainerBox>
        </ContainerBox>
      </>
    );
  },
  title: <FormattedMessage description="timelineTypeSwap" defaultMessage="Swap Executed" />,
  time: positionState.tx.timestamp,
  id: positionState.tx.hash,
});

const buildCreatedItem = (positionState: DCAPositionCreatedAction, position: Position) => ({
  icon: <ChartSquareIcon size={SPACING(6)} color="inherit" />,
  content: () => {
    const intl = useIntl();
    const [showCurrentPrice, setShowCurrentPrice] = useState(true);

    const { fromPrice } = positionState;
    const currentFromPrice = position.from.price;

    return (
      <>
        <ContainerBox flexDirection="column">
          <Typography
            variant="bodySmall"
            fontWeight={500}
            color={({ palette: { mode } }) => colors[mode].typography.typo3}
          >
            <FormattedMessage description="positionCreatedRate" defaultMessage="Rate" />
          </Typography>
          <ContainerBox alignItems="center" gap={2}>
            <TokenIcon token={position.from} size={5} />
            <ContainerBox gap={1}>
              <Typography
                variant="body"
                fontWeight={700}
                color={({ palette: { mode } }) => colors[mode].typography.typo2}
              >
                {formatCurrencyAmount(positionState.rate, position.from)}
              </Typography>
              {fromPrice && (
                <Tooltip
                  title={intl.formatMessage(showCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                  arrow
                  placement="top"
                >
                  <Typography
                    variant="body"
                    color={({ palette: { mode } }) => colors[mode].typography.typo3}
                    onClick={() => setShowCurrentPrice(!showCurrentPrice)}
                  >
                    ($
                    {parseUsdPrice(
                      position.from,
                      positionState.rate,
                      parseNumberUsdPriceToBigInt(showCurrentPrice ? currentFromPrice : fromPrice)
                    )}
                    )
                  </Typography>
                </Tooltip>
              )}
            </ContainerBox>
          </ContainerBox>
        </ContainerBox>
        <ContainerBox flexDirection="column">
          <Typography
            variant="bodySmall"
            fontWeight={500}
            color={({ palette: { mode } }) => colors[mode].typography.typo3}
          >
            <FormattedMessage description="positionCreatedDuration" defaultMessage="Duration" />
          </Typography>
          <ContainerBox>
            <Typography
              variant="body"
              fontWeight={700}
              color={({ palette: { mode } }) => colors[mode].typography.typo2}
            >
              {getTimeFrequencyLabel(intl, position.swapInterval.toString(), positionState.swaps.toString())}
            </Typography>
          </ContainerBox>
        </ContainerBox>
      </>
    );
  },
  title: <FormattedMessage description="timelineTypeCreated" defaultMessage="Position Created" />,
  time: positionState.tx.timestamp,
  id: positionState.tx.hash,
});

const buildTransferedItem = (positionState: DCAPositionTransferredAction, position: Position) => ({
  icon: <CardGiftcardIcon />,
  content: () => (
    <>
      <ContainerBox flexDirection="column">
        <Typography
          variant="bodySmall"
          fontWeight={500}
          color={({ palette: { mode } }) => colors[mode].typography.typo3}
        >
          <FormattedMessage description="transferedFrom" defaultMessage="Transfered from" />
        </Typography>
        <ContainerBox>
          <Typography variant="body" fontWeight={700} color={({ palette: { mode } }) => colors[mode].typography.typo2}>
            <StyledLink
              href={buildEtherscanAddress(positionState.from, position.chainId)}
              target="_blank"
              rel="noreferrer"
            >
              <Address address={positionState.from} trimAddress />
              <OpenInNewIcon style={{ fontSize: '1rem' }} />
            </StyledLink>
          </Typography>
        </ContainerBox>
      </ContainerBox>
      <ContainerBox flexDirection="column">
        <Typography
          variant="bodySmall"
          fontWeight={500}
          color={({ palette: { mode } }) => colors[mode].typography.typo3}
        >
          <FormattedMessage description="transferedTo" defaultMessage="Transfered to:" />
        </Typography>
        <ContainerBox>
          <Typography variant="body" fontWeight={700} color={({ palette: { mode } }) => colors[mode].typography.typo2}>
            <StyledLink
              href={buildEtherscanAddress(positionState.to, position.chainId)}
              target="_blank"
              rel="noreferrer"
            >
              <Address address={positionState.to} trimAddress />
              <OpenInNewIcon style={{ fontSize: '1rem' }} />
            </StyledLink>
          </Typography>
        </ContainerBox>
      </ContainerBox>
    </>
  ),
  title: <FormattedMessage description="timelineTypeTransfered" defaultMessage="Position Transfered" />,
  time: positionState.tx.timestamp,
  id: positionState.tx.hash,
});

const StyledCurrentValue = styled(Typography).attrs({ variant: 'body' })`
  ${({ theme: { palette } }) => `
    color: ${colors[palette.mode].typography.typo4}
    `}
`;

const StyledArrowIcon = styled(ArrowRightIcon)`
  transform: rotate(90deg);
  font-size: ${({ theme }) => theme.spacing(4)};
`;

const buildModifiedRateAndDurationItem = (positionState: DCAPositionModifiedAction, position: Position) => ({
  icon: <SettingsIcon />,
  content: () => {
    const { from, swapInterval, yields } = position;
    const [showCurrentPrice, setShowCurrentPrice] = useState(true);
    const fromPrice = from.price;
    const oldFromPrice = positionState.fromPrice;
    const rate = positionState.rate;
    const oldRate = positionState.oldRate;
    const remainingSwaps = positionState.remainingSwaps;
    const oldRemainingSwaps = positionState.oldRemainingSwaps;
    const remainingLiquidity = rate * BigInt(remainingSwaps);
    const oldRemainingLiquidity = oldRate * BigInt(oldRemainingSwaps);

    const oldRateUsd = parseUsdPrice(
      from,
      oldRate,
      parseNumberUsdPriceToBigInt(showCurrentPrice ? fromPrice : oldFromPrice)
    );
    const rateUsd = parseUsdPrice(from, rate, parseNumberUsdPriceToBigInt(showCurrentPrice ? fromPrice : oldFromPrice));
    const oldRemainingLiquidityUsd = parseUsdPrice(
      from,
      oldRemainingLiquidity,
      parseNumberUsdPriceToBigInt(showCurrentPrice ? fromPrice : oldFromPrice)
    );
    const remainingLiquidityUsd = parseUsdPrice(
      from,
      remainingLiquidity,
      parseNumberUsdPriceToBigInt(showCurrentPrice ? fromPrice : oldFromPrice)
    );

    const hasYield = !!yields.from;

    const intl = useIntl();
    return (
      <>
        <ContainerBox justifyContent="space-between" gap={2}>
          <ContainerBox flexDirection="column" alignItems="start">
            <Typography variant="bodySmall">
              <FormattedMessage description="totalInvested" defaultMessage="Total invested" />
            </Typography>
            <ContainerBox gap={0.5}>
              <StyledCurrentValue fontWeight={700}>
                {formatCurrencyAmount(oldRemainingLiquidity, from, 2)} {from.symbol}
              </StyledCurrentValue>
              <Tooltip
                title={intl.formatMessage(showCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                arrow
                placement="top"
              >
                <StyledCurrentValue onClick={() => setShowCurrentPrice(!showCurrentPrice)}>
                  (${usdFormatter(oldRemainingLiquidityUsd, 2)})
                </StyledCurrentValue>
              </Tooltip>
            </ContainerBox>
            <StyledArrowIcon />
            {oldRemainingLiquidity === remainingLiquidity ? (
              <StyledCurrentValue fontWeight={700}>=</StyledCurrentValue>
            ) : (
              <ContainerBox gap={0.5}>
                <Typography variant="body" fontWeight={700}>
                  {formatCurrencyAmount(remainingLiquidity, from, 2)} {from.symbol}
                </Typography>
                <Tooltip
                  title={intl.formatMessage(showCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                  arrow
                  placement="top"
                >
                  <Typography variant="body" onClick={() => setShowCurrentPrice(!showCurrentPrice)}>
                    (${usdFormatter(remainingLiquidityUsd, 2)})
                  </Typography>
                </Tooltip>
              </ContainerBox>
            )}
          </ContainerBox>
          <ContainerBox flexDirection="column" alignItems="start">
            <Typography variant="bodySmall">
              <FormattedMessage description="duration" defaultMessage="Duration" />
            </Typography>
            <StyledCurrentValue fontWeight={700}>
              {getTimeFrequencyLabel(intl, swapInterval.toString(), oldRemainingSwaps.toString())}
            </StyledCurrentValue>
            <StyledArrowIcon />
            {remainingSwaps === oldRemainingSwaps ? (
              <StyledCurrentValue fontWeight={700}>=</StyledCurrentValue>
            ) : (
              <Typography variant="body" fontWeight={700}>
                {getTimeFrequencyLabel(intl, swapInterval.toString(), remainingSwaps.toString())}
              </Typography>
            )}
          </ContainerBox>
          <ContainerBox flexDirection="column" alignItems="start">
            <Typography variant="bodySmall">
              <FormattedMessage description="rate" defaultMessage="Rate" />
            </Typography>
            <ContainerBox gap={0.5}>
              <StyledCurrentValue fontWeight={700}>
                {formatCurrencyAmount(oldRate, from, 2)} {from.symbol}
              </StyledCurrentValue>
              <Tooltip
                title={intl.formatMessage(showCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                arrow
                placement="top"
              >
                <StyledCurrentValue onClick={() => setShowCurrentPrice(!showCurrentPrice)}>
                  (${usdFormatter(oldRateUsd, 2)})
                </StyledCurrentValue>
              </Tooltip>
              {hasYield && (
                <StyledCurrentValue>
                  <FormattedMessage description="plusYield" defaultMessage="+ yield" />
                </StyledCurrentValue>
              )}
            </ContainerBox>
            <StyledArrowIcon />
            {oldRate === rate ? (
              <StyledCurrentValue fontWeight={700}>=</StyledCurrentValue>
            ) : (
              <ContainerBox gap={0.5}>
                <Typography variant="body" fontWeight={700}>
                  {formatCurrencyAmount(rate, from, 2)} {from.symbol}
                </Typography>
                <Tooltip
                  title={intl.formatMessage(showCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                  arrow
                  placement="top"
                >
                  <Typography variant="body" onClick={() => setShowCurrentPrice(!showCurrentPrice)}>
                    (${usdFormatter(rateUsd, 2)})
                  </Typography>
                </Tooltip>
                {hasYield && (
                  <Typography variant="body">
                    <FormattedMessage description="plusYield" defaultMessage="+ yield" />
                  </Typography>
                )}
              </ContainerBox>
            )}
          </ContainerBox>
        </ContainerBox>
      </>
    );
  },
  title: <FormattedMessage description="timelineTypeModified" defaultMessage="Position Modified" />,
  time: positionState.tx.timestamp,
  id: positionState.tx.hash,
});

const buildWithdrawnItem = (positionState: DCAPositionWithdrawnAction, position: Position) => ({
  icon: <WalletMoneyIcon size={SPACING(6)} color="inherit" />,
  content: () => {
    const intl = useIntl();
    const [showCurrentPrice, setShowCurrentPrice] = useState(true);
    const { withdrawn: baseWithdrawn, generatedByYield, toPrice: oldToPrice } = positionState;
    const { to } = position;
    const toPrice = to.price;

    const yieldAmount = generatedByYield?.withdrawn;
    const withdrawn = baseWithdrawn - (yieldAmount || 0n);

    const toUsd = parseUsdPrice(to, withdrawn, parseNumberUsdPriceToBigInt(showCurrentPrice ? toPrice : oldToPrice));
    const toYieldUsd = parseUsdPrice(
      to,
      yieldAmount,
      parseNumberUsdPriceToBigInt(showCurrentPrice ? toPrice : oldToPrice)
    );

    return (
      <>
        <ContainerBox flexDirection="column">
          <Typography
            variant="bodySmall"
            fontWeight={500}
            color={({ palette: { mode } }) => colors[mode].typography.typo3}
          >
            <FormattedMessage description="positionWithdrawWithdrawn" defaultMessage="Withdrawn" />
          </Typography>
          <ContainerBox alignItems="center" gap={2}>
            <TokenIcon token={to} size={5} />
            <ContainerBox flexDirection="column">
              <ContainerBox gap={1}>
                <Typography
                  variant="body"
                  fontWeight={700}
                  color={({ palette: { mode } }) => colors[mode].typography.typo2}
                >
                  {formatCurrencyAmount(withdrawn, to)}
                </Typography>
                {!!toUsd && (
                  <Tooltip
                    title={intl.formatMessage(showCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                    arrow
                    placement="top"
                  >
                    <Typography
                      variant="body"
                      color={({ palette: { mode } }) => colors[mode].typography.typo3}
                      onClick={() => setShowCurrentPrice(!showCurrentPrice)}
                    >
                      (${toUsd})
                    </Typography>
                  </Tooltip>
                )}
              </ContainerBox>
              {!!yieldAmount && (
                <ContainerBox gap={1}>
                  <Typography variant="body" color={({ palette: { mode } }) => colors[mode].typography.typo2}>
                    <FormattedMessage defaultMessage="+ yield" description="plusYield" />
                    {` `}
                    {formatCurrencyAmount(yieldAmount, to)}
                  </Typography>
                  {!!toYieldUsd && (
                    <Tooltip
                      title={intl.formatMessage(showCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                      arrow
                      placement="top"
                    >
                      <Typography
                        variant="body"
                        color={({ palette: { mode } }) => colors[mode].typography.typo3}
                        onClick={() => setShowCurrentPrice(!showCurrentPrice)}
                      >
                        (${toYieldUsd})
                      </Typography>
                    </Tooltip>
                  )}
                </ContainerBox>
              )}
            </ContainerBox>
          </ContainerBox>
        </ContainerBox>
      </>
    );
  },
  title: <FormattedMessage description="timelineTypeWithdrawn" defaultMessage="Position Withdrew" />,
  time: positionState.tx.timestamp,
  id: positionState.tx.hash,
});

const buildTerminatedItem = (positionState: DCAPositionTerminatedAction, position: Position) => ({
  icon: <DeleteSweepIcon />,
  // content: () => <></>,
  content: () => {
    const {
      withdrawnSwapped: baseWithdrawnSwapped,
      withdrawnRemaining: baseWithdrawnRemaining,
      generatedByYield,
      toPrice: oldToPrice,
      fromPrice: oldFromPrice,
    } = positionState;
    const intl = useIntl();
    const [showToCurrentPrice, setShowToCurrentPrice] = useState(true);
    const [showFromCurrentPrice, setShowFromCurrentPrice] = useState(true);
    const { to, from } = position;
    const toPrice = to.price;
    const fromPrice = from.price;

    const yieldToAmount = generatedByYield?.withdrawnSwapped;
    const withdrawnSwapped = baseWithdrawnSwapped - (yieldToAmount || 0n);
    const yieldFromAmount = generatedByYield?.withdrawnRemaining;
    const withdrawnRemaining = baseWithdrawnRemaining - (yieldFromAmount || 0n);

    const toUsd = parseUsdPrice(
      to,
      withdrawnSwapped,
      parseNumberUsdPriceToBigInt(showToCurrentPrice ? toPrice : oldToPrice)
    );
    const toYieldUsd = parseUsdPrice(
      to,
      yieldToAmount,
      parseNumberUsdPriceToBigInt(showToCurrentPrice ? toPrice : oldToPrice)
    );
    const fromUsd = parseUsdPrice(
      from,
      withdrawnRemaining,
      parseNumberUsdPriceToBigInt(showFromCurrentPrice ? fromPrice : oldFromPrice)
    );
    const fromYieldUsd = parseUsdPrice(
      from,
      yieldFromAmount,
      parseNumberUsdPriceToBigInt(showFromCurrentPrice ? fromPrice : oldFromPrice)
    );

    if (BigInt(withdrawnSwapped) <= 0n && BigInt(withdrawnRemaining) <= 0n) {
      return <></>;
    }

    return (
      <>
        {withdrawnSwapped > 0n && (
          <ContainerBox flexDirection="column">
            <Typography
              variant="bodySmall"
              fontWeight={500}
              color={({ palette: { mode } }) => colors[mode].typography.typo3}
            >
              <FormattedMessage description="positionCloseWithdrawnSwapped" defaultMessage="Withdrawn Swapped" />
            </Typography>
            <ContainerBox alignItems="center" gap={2}>
              <TokenIcon token={to} size={5} />
              <ContainerBox flexDirection="column">
                <ContainerBox gap={1}>
                  <Typography
                    variant="body"
                    fontWeight={700}
                    color={({ palette: { mode } }) => colors[mode].typography.typo2}
                  >
                    {formatCurrencyAmount(withdrawnSwapped, to)}
                  </Typography>
                  {!!toUsd && (
                    <Tooltip
                      title={intl.formatMessage(showToCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                      arrow
                      placement="top"
                    >
                      <Typography
                        variant="body"
                        color={({ palette: { mode } }) => colors[mode].typography.typo3}
                        onClick={() => setShowToCurrentPrice(!showToCurrentPrice)}
                      >
                        (${toUsd})
                      </Typography>
                    </Tooltip>
                  )}
                </ContainerBox>
                {!!yieldToAmount && (
                  <ContainerBox gap={1}>
                    <Typography variant="body" color={({ palette: { mode } }) => colors[mode].typography.typo2}>
                      <FormattedMessage defaultMessage="+ yield" description="plusYield" />
                      {` `}
                      {formatCurrencyAmount(yieldToAmount, to)}
                    </Typography>
                    {!!toYieldUsd && (
                      <Tooltip
                        title={intl.formatMessage(showToCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                        arrow
                        placement="top"
                      >
                        <Typography
                          variant="body"
                          color={({ palette: { mode } }) => colors[mode].typography.typo3}
                          onClick={() => setShowToCurrentPrice(!showToCurrentPrice)}
                        >
                          (${toYieldUsd})
                        </Typography>
                      </Tooltip>
                    )}
                  </ContainerBox>
                )}
              </ContainerBox>
            </ContainerBox>
          </ContainerBox>
        )}
        {withdrawnRemaining > 0n && (
          <ContainerBox flexDirection="column">
            <Typography
              variant="bodySmall"
              fontWeight={500}
              color={({ palette: { mode } }) => colors[mode].typography.typo3}
            >
              <FormattedMessage description="positionCloseWithdrawnFunds" defaultMessage="Withdrawn Funds" />
            </Typography>
            <ContainerBox alignItems="center" gap={2}>
              <TokenIcon token={from} size={5} />
              <ContainerBox flexDirection="column">
                <ContainerBox gap={1}>
                  <Typography
                    variant="body"
                    fontWeight={700}
                    color={({ palette: { mode } }) => colors[mode].typography.typo2}
                  >
                    {formatCurrencyAmount(withdrawnRemaining, from)}
                  </Typography>
                  {!!fromUsd && (
                    <Tooltip
                      title={intl.formatMessage(showFromCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                      arrow
                      placement="top"
                    >
                      <Typography
                        variant="body"
                        color={({ palette: { mode } }) => colors[mode].typography.typo3}
                        onClick={() => setShowFromCurrentPrice(!showFromCurrentPrice)}
                      >
                        (${fromUsd})
                      </Typography>
                    </Tooltip>
                  )}
                </ContainerBox>
                {!!yieldFromAmount && (
                  <ContainerBox gap={1}>
                    <Typography variant="body" color={({ palette: { mode } }) => colors[mode].typography.typo2}>
                      <FormattedMessage defaultMessage="+ yield" description="plusYield" />
                      {` `}
                      {formatCurrencyAmount(yieldFromAmount, from)}
                    </Typography>
                    {!!fromYieldUsd && (
                      <Tooltip
                        title={intl.formatMessage(showFromCurrentPrice ? currentPriceMessage : prevPriceMessage)}
                        arrow
                        placement="top"
                      >
                        <Typography
                          variant="body"
                          color={({ palette: { mode } }) => colors[mode].typography.typo3}
                          onClick={() => setShowFromCurrentPrice(!showFromCurrentPrice)}
                        >
                          (${fromYieldUsd})
                        </Typography>
                      </Tooltip>
                    )}
                  </ContainerBox>
                )}
              </ContainerBox>
            </ContainerBox>
          </ContainerBox>
        )}
      </>
    );
  },
  title: <FormattedMessage description="timelineTypeWithdrawn" defaultMessage="Position Closed" />,
  time: positionState.tx.timestamp,
  id: positionState.tx.hash,
});

const MESSAGE_MAP = {
  [ActionTypeAction.CREATED]: buildCreatedItem,
  [ActionTypeAction.MODIFIED]: buildModifiedRateAndDurationItem,
  [ActionTypeAction.SWAPPED]: buildSwappedItem,
  [ActionTypeAction.WITHDRAWN]: buildWithdrawnItem,
  [ActionTypeAction.TERMINATED]: buildTerminatedItem,
  [ActionTypeAction.TRANSFERRED]: buildTransferedItem,
  [ActionTypeAction.MODIFIED_PERMISSIONS]: () => null,
};

const FILTERS = {
  0: [
    ActionTypeAction.CREATED,
    ActionTypeAction.MODIFIED,
    ActionTypeAction.MODIFIED_PERMISSIONS,
    ActionTypeAction.SWAPPED,
    ActionTypeAction.TERMINATED,
    ActionTypeAction.TRANSFERRED,
    ActionTypeAction.WITHDRAWN,
  ],
  1: [ActionTypeAction.SWAPPED],
  2: [
    ActionTypeAction.CREATED,
    ActionTypeAction.MODIFIED,
    ActionTypeAction.TRANSFERRED,
    ActionTypeAction.TERMINATED,
    ActionTypeAction.MODIFIED_PERMISSIONS,
  ],
  3: [ActionTypeAction.WITHDRAWN],
};

const PositionTimeline = ({ position, filter }: PositionTimelineProps) => {
  let history = [];

  const prices = usePositionPrices(position.id);
  const toPrice = prices?.toPrice;
  const fromPrice = prices?.fromPrice;

  const mappedPositionHistory = compact(
    position.history
      .filter((positionState) => FILTERS[filter].includes(positionState.action))
      .map((positionState) =>
        // @ts-expect-error ts will not get the type correctly based on the message map
        MESSAGE_MAP[positionState.action](positionState, position, position.chainId, fromPrice, toPrice)
      )
  );

  history = orderBy(mappedPositionHistory, ['time'], ['desc']);

  return (
    <StyledTimeline flexDirection="column">
      {history.map((historyItem) => (
        <StyledTimelineContainer key={historyItem.id}>
          <StyledTimelineIcon>{historyItem.icon}</StyledTimelineIcon>
          <StyledTimelineContent>
            <Grid container>
              <StyledTimelineContentTitle item xs={12}>
                <Typography variant="body" fontWeight={700}>
                  {historyItem.title}
                </Typography>
                <StyledTitleEnd>
                  <Tooltip
                    title={DateTime.fromSeconds(historyItem.time).toLocaleString(DateTime.DATETIME_FULL)}
                    arrow
                    placement="top"
                  >
                    <StyledTitleMainText variant="bodySmall">
                      {DateTime.fromSeconds(historyItem.time).toRelative()}
                    </StyledTitleMainText>
                  </Tooltip>
                  <Typography variant="bodySmall">
                    <StyledLink
                      href={buildEtherscanTransaction(historyItem.id, position.chainId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <OpenInNewIcon fontSize="inherit" />
                    </StyledLink>
                  </Typography>
                </StyledTitleEnd>
              </StyledTimelineContentTitle>
              <Grid item xs={12}>
                <ContainerBox gap={6}>
                  <historyItem.content />
                </ContainerBox>
              </Grid>
            </Grid>
          </StyledTimelineContent>
        </StyledTimelineContainer>
      ))}
    </StyledTimeline>
  );
};
export default PositionTimeline;
