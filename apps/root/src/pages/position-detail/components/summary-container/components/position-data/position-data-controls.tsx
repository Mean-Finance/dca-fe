import * as React from 'react';
import find from 'lodash/find';
import { Typography, Link, OpenInNewIcon, Button } from 'ui-library';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { FullPosition, NetworkStruct, WalletStatus, YieldOptions } from '@types';
import {
  CHAIN_CHANGING_WALLETS_WITHOUT_REFRESH,
  DCA_TOKEN_BLACKLIST,
  NETWORKS,
  OLD_VERSIONS,
  VERSIONS_ALLOWED_MODIFY,
  shouldEnableFrequency,
} from '@constants';
import { BigNumber } from 'ethers';
import { buildEtherscanTransaction } from '@common/utils/etherscan';
import useWalletService from '@hooks/useWalletService';
import useSupportsSigning from '@hooks/useSupportsSigning';
import { fullPositionToMappedPosition } from '@common/utils/parsing';
import useWeb3Service from '@hooks/useWeb3Service';
import useTokenList from '@hooks/useTokenList';
import { setNetwork } from '@state/config/actions';
import { useAppDispatch } from '@state/hooks';
import useWallets from '@hooks/useWallets';
import useWalletNetwork from '@hooks/useWalletNetwork';
import useWallet from '@hooks/useWallet';
import { usePrivy } from '@privy-io/react-auth';

const StyledCardFooterButton = styled(Button)``;

const StyledCallToActionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 8px;
`;

interface PositionDataControlsProps {
  position: FullPosition;
  pendingTransaction: string | null;
  onReusePosition: () => void;
  yieldOptions: YieldOptions;
  onMigrateYield: () => void;
  onSuggestMigrateYield: () => void;
}

const PositionDataControls = ({
  position,
  onMigrateYield,
  onReusePosition,
  yieldOptions,
  pendingTransaction,
  onSuggestMigrateYield,
}: PositionDataControlsProps) => {
  const { connectWallet } = usePrivy();
  const { remainingSwaps, chainId, user } = fullPositionToMappedPosition(position);
  const hasSignSupport = useSupportsSigning();
  const web3Service = useWeb3Service();
  const wallet = useWallet(user);
  const [connectedNetwork] = useWalletNetwork(user);
  const tokenList = useTokenList();
  const wallets = useWallets();
  const dispatch = useAppDispatch();

  const positionNetwork = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const supportedNetwork = find(NETWORKS, { chainId })!;
    return supportedNetwork;
  }, [chainId]);

  const isOnNetwork = connectedNetwork?.chainId === positionNetwork.chainId;
  const walletService = useWalletService();
  const isPending = !!pendingTransaction;

  const onChangeNetwork = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    walletService.changeNetwork(chainId, user, () => {
      const networkToSet = find(NETWORKS, { chainId });
      dispatch(setNetwork(networkToSet as NetworkStruct));
      if (networkToSet) {
        web3Service.setNetwork(networkToSet?.chainId);
      }
    });
  };

  const walletIsConnected = wallet.status === WalletStatus.connected;

  const showSwitchAction =
    walletIsConnected && !isOnNetwork && !CHAIN_CHANGING_WALLETS_WITHOUT_REFRESH.includes(wallet.providerInfo.name);

  const isOwner = wallets.find((userWallet) => userWallet.address.toLowerCase() === position.user.toLowerCase());

  const disabled = showSwitchAction || !walletIsConnected;

  if (!isOwner || position.status === 'TERMINATED') return null;

  if (isPending) {
    return (
      <StyledCallToActionContainer>
        <StyledCardFooterButton variant="contained" color="pending" fullWidth>
          <Link
            href={buildEtherscanTransaction(pendingTransaction, positionNetwork.chainId)}
            target="_blank"
            rel="noreferrer"
            underline="none"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Typography variant="bodySmall" component="span">
              <FormattedMessage description="pending transaction" defaultMessage="Pending transaction" />
            </Typography>
            <OpenInNewIcon style={{ fontSize: '1rem' }} />
          </Link>
        </StyledCardFooterButton>
      </StyledCallToActionContainer>
    );
  }

  if (!walletIsConnected) {
    return (
      <StyledCallToActionContainer>
        <StyledCardFooterButton variant="contained" color="secondary" onClick={connectWallet} fullWidth>
          <Typography variant="bodySmall">
            <FormattedMessage description="reconnect wallet" defaultMessage="Reconnect wallet" />
          </Typography>
        </StyledCardFooterButton>
      </StyledCallToActionContainer>
    );
  }

  if (showSwitchAction) {
    return (
      <StyledCallToActionContainer>
        <StyledCardFooterButton variant="contained" color="secondary" onClick={onChangeNetwork} fullWidth>
          <Typography variant="bodySmall">
            <FormattedMessage
              description="incorrect network"
              defaultMessage="Switch to {network}"
              values={{ network: positionNetwork.name }}
            />
          </Typography>
        </StyledCardFooterButton>
      </StyledCallToActionContainer>
    );
  }

  const fromIsSupportedInNewVersion = !!tokenList[position.from.address];
  const toIsSupportedInNewVersion = !!tokenList[position.to.address];
  const fromSupportsYield = find(yieldOptions, { enabledTokens: [position.from.address] });
  const fromHasYield = !!position.from.underlyingTokens.length;
  const toHasYield = !!position.to.underlyingTokens.length;
  const toSupportsYield = find(yieldOptions, { enabledTokens: [position.to.address] });

  const shouldMigrateToYield =
    !!(fromSupportsYield || toSupportsYield) && fromIsSupportedInNewVersion && toIsSupportedInNewVersion;

  const shouldShowMigrate = hasSignSupport && shouldMigrateToYield && remainingSwaps.gt(BigNumber.from(0));

  const isOldVersion = OLD_VERSIONS.includes(position.version);

  const allowsModify = VERSIONS_ALLOWED_MODIFY.includes(position.version);

  const disabledIncrease =
    disabled ||
    DCA_TOKEN_BLACKLIST.includes(position.pair.id) ||
    DCA_TOKEN_BLACKLIST.includes(position.from.address) ||
    DCA_TOKEN_BLACKLIST.includes((fromHasYield && position.from.underlyingTokens[0]?.address) || '') ||
    DCA_TOKEN_BLACKLIST.includes((toHasYield && position.to.underlyingTokens[0]?.address) || '') ||
    !shouldEnableFrequency(
      position.swapInterval.interval,
      position.from.address,
      position.to.address,
      position.chainId
    );

  return (
    <StyledCallToActionContainer>
      {!isOldVersion && (
        <StyledCardFooterButton
          variant="contained"
          color="secondary"
          onClick={onReusePosition}
          disabled={disabledIncrease}
          fullWidth
        >
          <Typography variant="bodySmall">
            <FormattedMessage description="addFunds" defaultMessage="Add funds" />
          </Typography>
        </StyledCardFooterButton>
      )}
      {isOldVersion && shouldShowMigrate && (
        <StyledCardFooterButton
          variant="contained"
          color="migrate"
          onClick={onMigrateYield}
          fullWidth
          disabled={disabled}
        >
          <Typography variant="bodySmall">
            <FormattedMessage description="startEarningYield" defaultMessage="Start generating yield" />
          </Typography>
        </StyledCardFooterButton>
      )}
      {isOldVersion && shouldMigrateToYield && allowsModify && remainingSwaps.lte(BigNumber.from(0)) && (
        <StyledCardFooterButton
          variant="contained"
          color="secondary"
          onClick={onSuggestMigrateYield}
          fullWidth
          disabled={disabledIncrease}
        >
          <Typography variant="bodySmall">
            <FormattedMessage description="addFunds" defaultMessage="Add funds" />
          </Typography>
        </StyledCardFooterButton>
      )}
      {isOldVersion && !shouldMigrateToYield && allowsModify && (
        <StyledCardFooterButton
          variant="contained"
          color="secondary"
          onClick={onReusePosition}
          fullWidth
          disabled={disabledIncrease}
        >
          <Typography variant="bodySmall">
            <FormattedMessage description="addFunds" defaultMessage="Add funds" />
          </Typography>
        </StyledCardFooterButton>
      )}
      {isOldVersion && shouldMigrateToYield && !allowsModify && (
        <StyledCardFooterButton
          variant="contained"
          color="migrate"
          onClick={onMigrateYield}
          fullWidth
          disabled={disabled}
        >
          <Typography variant="bodySmall">
            <FormattedMessage description="startEarningYield" defaultMessage="Start generating yield" />
          </Typography>
        </StyledCardFooterButton>
      )}
    </StyledCallToActionContainer>
  );
};
export default PositionDataControls;
