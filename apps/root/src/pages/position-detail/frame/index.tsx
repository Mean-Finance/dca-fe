import React from 'react';
import { Grid, Typography, BackControl, ContainerBox } from 'ui-library';
import { useParams } from 'react-router-dom';
import { PositionVersions } from '@types';
import { usePositionHasPendingTransaction } from '@state/transactions/hooks';
import { useAppDispatch } from '@state/hooks';
import { changeRoute } from '@state/tabs/actions';
import { FormattedMessage, defineMessage, useIntl } from 'react-intl';
import { fetchPositionAndTokenPrices } from '@state/position-details/actions';
import { usePositionDetails } from '@state/position-details/hooks';
import useYieldOptions from '@hooks/useYieldOptions';
import useTrackEvent from '@hooks/useTrackEvent';
import usePushToHistory from '@hooks/usePushToHistory';
import PositionNotFound from '../components/position-not-found';
import PositionControls from '../components/position-summary-controls';
import PositionSummaryContainer from '../components/summary-container';
import { DCA_ROUTE } from '@constants/routes';
import PositionWarning from '@pages/dca/positions/components/positions-list/position-card/components/position-warning';

const PositionDetailFrame = () => {
  const { positionId, chainId, positionVersion } = useParams<{
    positionId: string;
    chainId: string;
    positionVersion: PositionVersions;
  }>();
  const pushToHistory = usePushToHistory();
  const dispatch = useAppDispatch();
  const trackEvent = useTrackEvent();
  const intl = useIntl();

  const [yieldOptions, isLoadingYieldOptions] = useYieldOptions(Number(chainId));

  const { isLoading, position } = usePositionDetails(`${chainId}-${positionId}-v${positionVersion}`);
  const pendingTransaction = usePositionHasPendingTransaction(position?.id || '');

  React.useEffect(() => {
    dispatch(changeRoute(DCA_ROUTE.key));
    trackEvent('DCA - Visit position detail page', { chainId });
    if (positionId && chainId && positionVersion) {
      void dispatch(
        fetchPositionAndTokenPrices({
          positionId: Number(positionId),
          chainId: Number(chainId),
          version: positionVersion,
        })
      );
    }
  }, []);

  if (!position && !isLoading) {
    return <PositionNotFound />;
  }

  const onBackToPositions = () => {
    dispatch(changeRoute(DCA_ROUTE.key));
    pushToHistory('/positions');
    trackEvent('DCA - Go back to positions');
  };

  return (
    <Grid container rowSpacing={6}>
      <Grid item xs={12}>
        <ContainerBox justifyContent="space-between">
          <ContainerBox flexDirection="column" gap={4}>
            <BackControl
              onClick={onBackToPositions}
              label={intl.formatMessage(defineMessage({ defaultMessage: 'Back', description: 'back' }))}
            />
            <Typography variant="h3">
              <FormattedMessage description="positionPerformance" defaultMessage="Position Performance" />
            </Typography>
          </ContainerBox>
          {position && position.status !== 'TERMINATED' && (
            <PositionControls position={position} pendingTransaction={pendingTransaction} />
          )}
        </ContainerBox>
      </Grid>
      <Grid item xs={12}>
        {position && yieldOptions && <PositionWarning position={position} yieldOptions={yieldOptions} />}
        <PositionSummaryContainer
          position={position}
          isLoading={isLoading}
          pendingTransaction={pendingTransaction}
          yieldOptions={yieldOptions}
          isLoadingYieldOptions={isLoadingYieldOptions}
        />
      </Grid>
    </Grid>
  );
};
export default PositionDetailFrame;
