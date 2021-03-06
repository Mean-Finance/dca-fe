import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import Typography from '@mui/material/Typography';
import { FullPosition, GetPairSwapsData } from 'types';
import { calculateStale, getFrequencyLabel, STALE } from 'utils/parsing';
import { BigNumber } from 'ethers';

const PositionStatusContainer = styled.div<{ alignedEnd?: boolean }>`
  display: flex;
  align-self: ${(props) => (props.alignedEnd ? 'flex-end' : 'flex-start')};
`;

const StyledFreqLeft = styled.div`
  ${({ theme }) => `
    padding: 8px 11px;
    border-radius: 5px;
    background-color: ${theme.palette.mode === 'light' ? '#dceff9' : '#275f7c'};
    color: ${theme.palette.mode === 'light' ? '#0088cc' : '#ffffff'};
    margin-right: 15px;
  `}
`;

const StyledStale = styled.div`
  padding: 8px 11px;
  border-radius: 5px;
  background-color: #f9f3dc;
  color: #cc6d00;
  * {
    font-weight: 600 !important;
  }
`;

const StyledNoFunds = styled.div`
  ${({ theme }) => `
    padding: 8px 11px;
    border-radius: 5px;
    background-color: ${theme.palette.mode === 'light' ? '#dceff9' : '#275f7c'};
    color: ${theme.palette.mode === 'light' ? '#0088cc' : '#ffffff'};
  `}
`;

interface PositionStatusProps {
  position: FullPosition;
  pair?: GetPairSwapsData;
  alignedEnd?: boolean;
}

const PositionStatus = ({ position, pair, alignedEnd }: PositionStatusProps) => {
  if (!pair) return null;
  const lastExecutedAt = (pair.swaps && pair.swaps[0] && pair.swaps[0].executedAtTimestamp) || '0';

  const isStale =
    calculateStale(
      parseInt(lastExecutedAt, 10) || 0,
      BigNumber.from(position.swapInterval.interval),
      parseInt(position.createdAtTimestamp, 10) || 0,
      pair.nextSwapAvailableAt
    ) === STALE;

  const hasNoFunds = BigNumber.from(position.current.remainingLiquidity).lte(BigNumber.from(0));

  const isTerminated = position.status === 'TERMINATED';
  return (
    <PositionStatusContainer alignedEnd={alignedEnd}>
      {/* eslint-disable-next-line no-nested-ternary */}
      {isTerminated ? (
        <StyledNoFunds>
          <Typography variant="body1">
            <FormattedMessage description="terminated" defaultMessage="Terminated" />
          </Typography>
        </StyledNoFunds>
      ) : // eslint-disable-next-line no-nested-ternary
      hasNoFunds ? (
        <StyledNoFunds>
          <Typography variant="body1">
            <FormattedMessage description="no funds" defaultMessage="Position finished" />
          </Typography>
        </StyledNoFunds>
      ) : isStale ? (
        <StyledStale>
          <Typography variant="body1">
            <FormattedMessage description="stale" defaultMessage="Stale" />
          </Typography>
        </StyledStale>
      ) : (
        <StyledFreqLeft>
          <Typography variant="body1">
            <FormattedMessage
              description="days to finish"
              defaultMessage="{type} left"
              values={{
                type: getFrequencyLabel(position.swapInterval.interval, position.current.remainingSwaps),
              }}
            />
          </Typography>
        </StyledFreqLeft>
      )}
    </PositionStatusContainer>
  );
};

export default PositionStatus;
