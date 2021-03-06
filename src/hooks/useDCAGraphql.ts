import { POSITION_VERSION_3, PositionVersions } from 'config';
import useCurrentNetwork from './useCurrentNetwork';
import useWeb3Service from './useWeb3Service';

function useDCAGraphql(chainId?: number, version: PositionVersions = POSITION_VERSION_3) {
  const web3Service = useWeb3Service();
  const currentNetwork = useCurrentNetwork();
  const chainIdTouse = chainId || currentNetwork.chainId;

  return web3Service.getDCAGraphqlClient()[version][chainIdTouse].getClient();
}

export default useDCAGraphql;
