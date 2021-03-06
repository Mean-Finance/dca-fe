import { ethers, Signer, BigNumber } from 'ethers';
import { AxiosInstance } from 'axios';
import { Interface } from '@ethersproject/abi';
import { TransactionResponse, Network } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import find from 'lodash/find';
import { GetUsedTokensData, Token } from 'types';
import { MaxUint256 } from '@ethersproject/constants';
import isUndefined from 'lodash/isUndefined';

// ABIS
import ERC20ABI from 'abis/erc20.json';

// MOCKS
import { PROTOCOL_TOKEN_ADDRESS } from 'mocks/tokens';
import { NETWORKS } from 'config/constants';
import { ERC20Contract } from 'types/contracts';
import ContractService from './contractService';

export default class WalletService {
  client: ethers.providers.Web3Provider;

  signer: Signer;

  network: Network;

  account: string | null;

  contractService: ContractService;

  axiosClient: AxiosInstance;

  constructor(contractService: ContractService, axiosClient: AxiosInstance, client?: ethers.providers.Web3Provider) {
    if (client) {
      this.client = client;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.setAccount();
    }

    this.contractService = contractService;
    this.axiosClient = axiosClient;
  }

  // GETTERS AND SETTERS
  setClient(client: ethers.providers.Web3Provider) {
    this.client = client;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.setAccount();
  }

  setSigner(signer: Signer) {
    this.signer = signer;
  }

  getClient() {
    return this.client;
  }

  async setAccount(account?: string | null) {
    this.account = isUndefined(account) ? await this.client.getSigner().getAddress() : account;
  }

  getAccount() {
    return this.account || '';
  }

  getSigner() {
    return this.signer;
  }

  getUsedTokens() {
    return this.axiosClient.get<GetUsedTokensData>(
      `https://api.ethplorer.io/getAddressInfo/${this.getAccount() || ''}?apiKey=${process.env.ETHPLORER_KEY || ''}`
    );
  }

  async getNetwork(skipDefaultNetwork = false) {
    // [TODO] Remove references to walletService.getNetwork()
    return this.contractService.getNetwork(skipDefaultNetwork);
  }

  async getEns(address: string) {
    let ens = null;
    try {
      const provider = ethers.getDefaultProvider('homestead', {
        infura: '5744aff1d49f4eee923c5f3e5af4cc1c',
        etherscan: '4UTUC6B8A4X6Z3S1PVVUUXFX6IVTFNQEUF',
      });
      ens = await provider.lookupAddress(address);
      // eslint-disable-next-line no-empty
    } catch {}

    return ens;
  }

  async changeNetwork(newChainId: number, callbackBeforeReload?: () => void): Promise<void> {
    if (!window.ethereum) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${newChainId.toString(16)}` }],
      });
      if (callbackBeforeReload) {
        callbackBeforeReload();
      }
      window.location.reload();
    } catch (switchError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (switchError.code === 4902) {
        try {
          const network = find(NETWORKS, { chainId: newChainId });

          if (network) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${newChainId.toString(16)}`,
                  chainName: network.name,
                  nativeCurrency: network.nativeCurrency,
                  rpcUrls: network.rpc,
                },
              ],
            });
            window.location.reload();
          }
        } catch (addError) {
          console.error('Error adding new chain to metamask');
        }
      }
    }
  }

  getBalance(address?: string): Promise<BigNumber> {
    const account = this.getAccount();

    if (!address || !account) return Promise.resolve(BigNumber.from(0));

    if (address === PROTOCOL_TOKEN_ADDRESS) return this.signer.getBalance();

    const ERC20Interface = new Interface(ERC20ABI);

    const erc20 = new ethers.Contract(address, ERC20Interface, this.client) as unknown as ERC20Contract;

    return erc20.balanceOf(account);
  }

  async getAllowance(token: Token) {
    const account = this.getAccount();

    if (token.address === PROTOCOL_TOKEN_ADDRESS || !account) {
      return Promise.resolve({ token, allowance: formatUnits(MaxUint256, 18) });
    }

    const addressToCheck = await this.contractService.getHUBAddress();

    const erc20 = await this.contractService.getTokenInstance(token.address);

    const allowance = await erc20.allowance(account, addressToCheck);

    return {
      token,
      allowance: formatUnits(allowance, token.decimals),
    };
  }

  async approveToken(token: Token): Promise<TransactionResponse> {
    const addressToApprove = await this.contractService.getHUBAddress();

    const erc20 = await this.contractService.getTokenInstance(token.address);

    return erc20.approve(addressToApprove, MaxUint256);
  }
}
