import React from 'react';
import styled from 'styled-components';
import { Grid, Alert } from 'ui-library';
import isUndefined from 'lodash/isUndefined';
import { SwapOption, Token } from '@types';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { BigNumber } from 'ethers';
import { formatUnits, parseUnits } from '@ethersproject/units';
import useUsdPrice from '@hooks/useUsdPrice';
import useSelectedNetwork from '@hooks/useSelectedNetwork';
import useIsPermit2Enabled from '@hooks/useIsPermit2Enabled';
import QuoteData from '../quote-data';
import TransferTo from '../transfer-to';
import QuoteSimulation from '../quote-simulation';
import TopBar from '../top-bar';
import FromAmountInput from '../from-amount-input';
import ToggleButton from '../toggle-button';
import ToAmountInput from '../to-amount-input';
import QuoteSelection from '../quote-selection';

const StyledGrid = styled(Grid)`
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 90;
`;

const StyledContentContainer = styled.div<{ hasArrow?: boolean; $isLast?: boolean }>`
  background-color: #292929;
  position: relative;
  padding: 16px;
  border-radius: 8px;
  gap: 16px;
  display: flex;
  flex-direction: column;
  ${({ hasArrow }) => hasArrow && 'padding-bottom: 30px;'}
  ${({ $isLast }) => $isLast && 'border-bottom-right-radius: 0px;border-bottom-left-radius: 0px;'}
`;

interface SwapFirstStepProps {
  from: Token | null;
  fromValue: string;
  to: Token | null;
  toValue: string;
  startSelectingCoin: (token: Token) => void;
  cantFund: boolean | null;
  balance?: BigNumber;
  selectedRoute: SwapOption | null;
  isBuyOrder: boolean;
  isLoadingRoute: boolean;
  transferTo: string | null;
  onOpenTransferTo: () => void;
  onShowSettings: () => void;
  isApproved: boolean;
  setTransactionWillFail: (transactionWillFail: boolean) => void;
  quotes: SwapOption[];
  fetchOptions: () => void;
  refreshQuotes: boolean;
  swapOptionsError?: string;
}

const SwapFirstStep = React.forwardRef<HTMLDivElement, SwapFirstStepProps>((props, ref) => {
  const {
    from,
    to,
    fromValue,
    toValue,
    startSelectingCoin,
    cantFund,
    balance,
    selectedRoute,
    isBuyOrder,
    isLoadingRoute,
    transferTo,
    onOpenTransferTo,
    isApproved,
    setTransactionWillFail,
    onShowSettings,
    quotes,
    fetchOptions,
    refreshQuotes,
    swapOptionsError,
  } = props;

  const intl = useIntl();
  let fromValueToUse =
    isBuyOrder && selectedRoute
      ? (selectedRoute?.sellToken.address === from?.address &&
          formatUnits(selectedRoute.sellAmount.amount, selectedRoute.sellToken.decimals)) ||
        '0'
      : fromValue;
  let toValueToUse = isBuyOrder
    ? toValue
    : (selectedRoute?.buyToken.address === to?.address &&
        formatUnits(selectedRoute?.buyAmount.amount || '0', selectedRoute?.buyToken.decimals)) ||
      '0' ||
      '';

  const selectedNetwork = useSelectedNetwork();

  const isPermit2Enabled = useIsPermit2Enabled(selectedNetwork.chainId);

  const [fromFetchedPrice, isLoadingFromPrice] = useUsdPrice(
    from,
    parseUnits(fromValueToUse || '0', selectedRoute?.sellToken.decimals || from?.decimals),
    undefined,
    selectedNetwork.chainId
  );
  const [toFetchedPrice, isLoadingToPrice] = useUsdPrice(
    to,
    parseUnits(toValueToUse || '0', selectedRoute?.buyToken.decimals || to?.decimals),
    undefined,
    selectedNetwork.chainId
  );
  const fromPrice = selectedRoute?.sellAmount.amountInUSD;
  const toPrice = selectedRoute?.buyAmount.amountInUSD;

  const fromPriceToShow = fromPrice || fromFetchedPrice;
  const toPriceToShow = toPrice || toFetchedPrice;

  if (isLoadingRoute) {
    if (isBuyOrder) {
      fromValueToUse = '...';
    } else {
      toValueToUse = '...';
    }
  }

  const priceImpact =
    !!selectedRoute &&
    !!selectedRoute.buyAmount.amountInUSD &&
    !!selectedRoute.sellAmount.amountInUSD &&
    (
      Math.round(
        ((Number(selectedRoute.buyAmount.amountInUSD) - Number(selectedRoute.sellAmount.amountInUSD)) /
          Number(selectedRoute.sellAmount.amountInUSD)) *
          10000
      ) / 100
    ).toFixed(2);

  return (
    <StyledGrid container rowSpacing={2} ref={ref}>
      <Grid item xs={12} sx={{ position: 'relative' }}>
        <StyledContentContainer>
          <TopBar onShowSettings={onShowSettings} />
        </StyledContentContainer>
      </Grid>
      <Grid item xs={12} sx={{ position: 'relative' }}>
        <StyledContentContainer hasArrow>
          <FromAmountInput
            cantFund={cantFund}
            balance={balance}
            fromValue={fromValueToUse}
            isLoadingRoute={isLoadingRoute}
            isLoadingFromPrice={isLoadingFromPrice}
            fromPrice={fromPriceToShow}
            startSelectingCoin={startSelectingCoin}
            isBuyOrder={isBuyOrder}
          />
        </StyledContentContainer>
        <ToggleButton isLoadingRoute={isLoadingRoute} />
      </Grid>
      <Grid item xs={12} sx={{ paddingTop: '8px !important' }}>
        <StyledContentContainer>
          <ToAmountInput
            toValue={toValueToUse}
            isLoadingRoute={isLoadingRoute}
            isLoadingToPrice={isLoadingToPrice}
            toPrice={toPriceToShow}
            startSelectingCoin={startSelectingCoin}
            isBuyOrder={isBuyOrder}
            priceImpact={priceImpact}
          />
        </StyledContentContainer>
      </Grid>
      {(isLoadingRoute || selectedRoute || transferTo || swapOptionsError) && (
        <Grid item xs={12}>
          <StyledContentContainer $isLast>
            {transferTo && <TransferTo transferTo={transferTo} onOpenTransferTo={onOpenTransferTo} />}
            <QuoteSelection
              quotes={quotes}
              isLoading={isLoadingRoute}
              bestQuote={quotes[0]}
              fetchOptions={fetchOptions}
              refreshQuotes={refreshQuotes}
              swapOptionsError={swapOptionsError}
            />
            {!isPermit2Enabled && (
              <QuoteSimulation
                route={selectedRoute}
                cantFund={cantFund}
                isApproved={isApproved}
                isLoadingRoute={isLoadingRoute}
                setTransactionWillFail={setTransactionWillFail}
                forceProviderSimulation={!!transferTo}
              />
            )}
            {selectedRoute && !isLoadingRoute && (isUndefined(fromPriceToShow) || isUndefined(toPriceToShow)) && (
              <Alert severity="warning" variant="outlined" sx={{ alignItems: 'center' }}>
                <FormattedMessage
                  description="aggregatorPriceNotFound"
                  defaultMessage="We couldn't calculate the price for {from}{and}{to}, which means we cannot estimate the price impact. Please be cautious and trade at your own risk."
                  values={{
                    from: isUndefined(fromPriceToShow) ? selectedRoute.sellToken.symbol : '',
                    to: isUndefined(toPriceToShow) ? selectedRoute.buyToken.symbol : '',
                    and:
                      isUndefined(fromPriceToShow) && isUndefined(toPriceToShow)
                        ? intl.formatMessage(
                            defineMessage({
                              defaultMessage: ' and ',
                              description: 'andWithSpaces',
                            })
                          )
                        : '',
                  }}
                />
              </Alert>
            )}
            <QuoteData quote={(!isLoadingRoute && selectedRoute) || null} isBuyOrder={isBuyOrder} to={to} />
          </StyledContentContainer>
        </Grid>
      )}
    </StyledGrid>
  );
});

export default SwapFirstStep;
