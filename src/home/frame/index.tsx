import React from 'react';
import Grid from '@mui/material/Grid';
import CenteredLoadingIndicator from 'common/centered-loading-indicator';
import { useMainTab } from 'state/tabs/hooks';
import { useParams } from 'react-router-dom';
import { SUPPORTED_NETWORKS } from 'config/constants';
import { GetSwapIntervalsGraphqlResponse } from 'types';
import useCurrentNetwork from 'hooks/useCurrentNetwork';
import { useQuery } from '@apollo/client';
import getAvailableIntervals from 'graphql/getAvailableIntervals.graphql';
import useDCAGraphql from 'hooks/useDCAGraphql';
import useWalletService from 'hooks/useWalletService';
import usePairService from 'hooks/usePairService';
import SwapContainer from '../swap-container';
import Positions from '../positions';

interface HomeFrameProps {
  isLoading: boolean;
}

const HomeFrame = ({ isLoading }: HomeFrameProps) => {
  const tabIndex = useMainTab();
  const walletService = useWalletService();
  const currentNetwork = useCurrentNetwork();
  const { chainId } = useParams<{ chainId: string }>();
  const client = useDCAGraphql();
  const pairService = usePairService();
  const [hasLoadedPairs, setHasLoadedPairs] = React.useState(pairService.getHasFetchedAvailablePairs());
  // const hasInitiallySetNetwork = React.useState()

  React.useEffect(() => {
    if (
      chainId &&
      SUPPORTED_NETWORKS.includes(parseInt(chainId, 10)) &&
      currentNetwork.isSet &&
      chainId !== currentNetwork.chainId.toString()
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      walletService.changeNetwork(parseInt(chainId, 10));
    }
  }, [currentNetwork]);
  React.useEffect(() => {
    const fetchPairs = async () => {
      await pairService.fetchAvailablePairs();
      setHasLoadedPairs(true);
    };

    if (!isLoading && !hasLoadedPairs) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchPairs();
    }
  }, [isLoading, hasLoadedPairs]);

  const { loading: isLoadingSwapIntervals, data: swapIntervalsData } = useQuery<GetSwapIntervalsGraphqlResponse>(
    getAvailableIntervals,
    {
      client,
    }
  );

  const isLoadingIntervals = isLoading || isLoadingSwapIntervals || !hasLoadedPairs;

  return (
    <Grid container spacing={8}>
      {isLoadingIntervals ? (
        <Grid item xs={12} style={{ display: 'flex' }}>
          <CenteredLoadingIndicator size={70} />
        </Grid>
      ) : (
        <>
          {tabIndex === 0 ? (
            <Grid item xs={12} style={{ display: 'flex' }}>
              <SwapContainer swapIntervalsData={swapIntervalsData} />
            </Grid>
          ) : (
            <Grid item xs={12} style={{ display: 'flex' }}>
              <Positions />
            </Grid>
          )}
        </>
      )}
    </Grid>
  );
};
export default HomeFrame;
