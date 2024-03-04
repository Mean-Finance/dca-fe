import React from 'react';
import { useAppDispatch } from '@hooks/state';
import { fetchInitialBalances, fetchPricesForAllChains } from '@state/balances/actions';
import useTokenListByChainId from '@hooks/useTokenListByChainId';
import { useIsLoadingAllTokenLists } from '@state/token-lists/hooks';
import { Button, Zoom, useSnackbar } from 'ui-library';
import { timeoutPromise } from '@mean-finance/sdk';
import { TimeoutPromises } from '@constants/timing';
import useContactListService from '@hooks/useContactListService';
import useTransactionService from '@hooks/useTransactionService';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { API_ERROR_MESSAGES, ApiErrorKeys } from '@constants';
import { SerializedError } from '@reduxjs/toolkit';
import useUser from '@hooks/useUser';
import { UserStatus } from 'common-types';
import useTrackEvent from '@hooks/useTrackEvent';

const PromisesInitializer = () => {
  const dispatch = useAppDispatch();
  const user = useUser();
  const tokenListByChainId = useTokenListByChainId();
  const isLoadingAllTokenLists = useIsLoadingAllTokenLists();
  const contactListService = useContactListService();
  const transactionService = useTransactionService();
  const intl = useIntl();
  const fetchRef = React.useRef(true);
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const trackEvent = useTrackEvent();

  const handleError = React.useCallback(
    (error: unknown) => {
      if (error instanceof Error) {
        const errorKey = Object.values(ApiErrorKeys).find((key) => error.message.includes(key));
        if (!errorKey) {
          return;
        }

        trackEvent(`Api initial request failed`, {
          requestType: errorKey,
          timeouted: error.message.includes('timeouted'),
        });

        snackbar.enqueueSnackbar(intl.formatMessage(API_ERROR_MESSAGES[errorKey]), {
          variant: 'error',
          action: (
            <>
              <Button
                onClick={() => {
                  navigate(0);
                }}
                color="success"
              >
                <FormattedMessage description="refresh" defaultMessage="Refresh" />
              </Button>
              <Button
                onClick={() => {
                  snackbar.closeSnackbar(errorKey);
                }}
              >
                <FormattedMessage description="close" defaultMessage="Close" />
              </Button>
            </>
          ),
          key: errorKey,
          preventDuplicate: true,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'right',
          },
          persist: true,
          TransitionComponent: Zoom,
        });
      }
    },
    [snackbar, navigate]
  );

  React.useEffect(() => {
    const fetchBalancesAndPrices = async () => {
      // Fire-and-Forget Promises
      timeoutPromise(contactListService.initializeAliasesAndContacts(), TimeoutPromises.COMMON, {
        description: ApiErrorKeys.LABELS_CONTACT_LIST,
      }).catch((error) => handleError(error));
      timeoutPromise(transactionService.fetchTransactionsHistory(), TimeoutPromises.COMMON, {
        description: ApiErrorKeys.HISTORY,
      }).catch((error) => handleError(error));

      // Awaited Promises
      try {
        await timeoutPromise(dispatch(fetchInitialBalances({ tokenListByChainId })).unwrap(), TimeoutPromises.COMMON, {
          description: ApiErrorKeys.BALANCES,
        });
        await timeoutPromise(dispatch(fetchPricesForAllChains()), TimeoutPromises.COMMON);
      } catch (error) {
        handleError(new Error((error as SerializedError).message));
      }
    };
    if (fetchRef.current && user?.status === UserStatus.loggedIn && !isLoadingAllTokenLists) {
      void fetchBalancesAndPrices();
      fetchRef.current = false;
    }
  }, [user?.status, tokenListByChainId, isLoadingAllTokenLists, handleError]);

  return null;
};

export default PromisesInitializer;
