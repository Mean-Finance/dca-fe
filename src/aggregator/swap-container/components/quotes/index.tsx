import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import EmptyRoutes from 'assets/svg/emptyRoutes';
import CenteredLoadingIndicator from 'common/centered-loading-indicator';
import { SwapSortOptions } from 'config/constants/aggregator';
import { ALL_SWAP_OPTIONS_FAILED } from 'hooks/useSwapOptions';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { SwapOption, Token } from 'types';
import SwapQuote from '../quote';
import QuoteRefresher from '../quote-refresher';
import QuoteSorter from '../quote-sorter';

const StyledPaper = styled(Paper)<{ $column?: boolean }>`
  padding: 16px;
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  flex-grow: 1;
  background-color: rgba(255, 255, 255, 0.01);
  backdrop-filter: blur(6px);
  display: flex;
  gap: 24px;
  flex-direction: ${({ $column }) => ($column ? 'column' : 'row')};
`;

const StyledTitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledCenteredWrapper = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
`;

interface SwapQuotesProps {
  quotes: SwapOption[];
  isLoading: boolean;
  from: Token | null;
  to: Token | null;
  selectedRoute: SwapOption | null;
  setRoute: (newRoute: SwapOption) => void;
  setSorting: (newSort: string) => void;
  sorting: SwapSortOptions;
  fetchOptions: () => void;
  refreshQuotes: boolean;
  isBuyOrder: boolean;
  bestQuote?: SwapOption;
  swapOptionsError?: string;
}

const SwapQuotes = ({
  quotes,
  isLoading,
  from,
  to,
  selectedRoute,
  setRoute,
  setSorting,
  sorting,
  fetchOptions,
  refreshQuotes,
  isBuyOrder,
  bestQuote,
  swapOptionsError,
}: SwapQuotesProps) => {
  if (!quotes.length && !isLoading && swapOptionsError === ALL_SWAP_OPTIONS_FAILED) {
    return (
      <StyledPaper variant="outlined" $column>
        <StyledPaper variant="outlined">
          <StyledCenteredWrapper>
            <ErrorOutlineIcon fontSize="large" />
            <Typography variant="h6">
              <FormattedMessage
                description="All routes failed"
                defaultMessage="We could not fetch a route for your swap"
              />
            </Typography>
          </StyledCenteredWrapper>
        </StyledPaper>
      </StyledPaper>
    );
  }

  if (!quotes.length && !isLoading) {
    return (
      <StyledPaper variant="outlined" $column>
        <StyledPaper variant="outlined">
          <StyledCenteredWrapper>
            <EmptyRoutes size="100px" />
            <Typography variant="h6">
              <FormattedMessage description="No route selected" defaultMessage="Fill the form to view route options" />
            </Typography>
          </StyledCenteredWrapper>
        </StyledPaper>
      </StyledPaper>
    );
  }

  return (
    <StyledPaper variant="outlined" $column>
      <StyledTitleContainer>
        <QuoteSorter isLoading={isLoading} setQuoteSorting={setSorting} sorting={sorting} />
        <QuoteRefresher isLoading={isLoading} refreshQuotes={fetchOptions} disableRefreshQuotes={!refreshQuotes} />
      </StyledTitleContainer>
      {isLoading && (
        <StyledCenteredWrapper>
          <CenteredLoadingIndicator size={40} noFlex />
          <FormattedMessage description="loadingBestRoute" defaultMessage="Fetching the best route for you" />
        </StyledCenteredWrapper>
      )}
      {!isLoading &&
        quotes.map((quote) => (
          <SwapQuote
            setRoute={setRoute}
            from={from}
            to={to}
            isSelected={quote.swapper.id === selectedRoute?.swapper.id}
            quote={quote}
            key={`${from?.symbol || ''}-${to?.symbol || ''}-${quote.swapper.id}`}
            isBuyOrder={isBuyOrder}
            bestQuote={bestQuote}
            sorting={sorting}
          />
        ))}
    </StyledPaper>
  );
};
export default SwapQuotes;
