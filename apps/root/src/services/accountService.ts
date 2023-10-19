import { ConnectedWallet, User as BasePrivyUser } from '@privy-io/react-auth';
import { IAccountService, UserType, WalletType, User, Wallet, AccountLabels } from '@types';
import { find } from 'lodash';
import Web3Service from './web3Service';

export default class AccountService implements IAccountService {
  user?: User;

  activeWallet?: Wallet;

  web3Service: Web3Service;

  constructor(web3Service: Web3Service) {
    this.web3Service = web3Service;
  }

  getUser(): User | undefined {
    return this.user;
  }

  getWallets(): Wallet[] {
    return this.user?.wallets || [];
  }

  setActiveWallet(wallet: string): void {
    const newActiveWallet = find(this.user?.wallets || [], { address: wallet.toLowerCase() })!;
    this.activeWallet = newActiveWallet;
  }

  async setAndConnectActiveWallet(wallet: string): Promise<void> {
    this.setActiveWallet(wallet);
    const provider = await this.activeWallet!.getProvider();
    await this.web3Service.connect(provider, undefined, undefined, this.activeWallet!.type === WalletType.embedded);
  }

  async getActiveWalletProvider() {
    if (!this.activeWallet) {
      return undefined;
    }

    return this.getWalletProvider(this.activeWallet.address);
  }

  async getActiveWalletSigner() {
    if (!this.activeWallet) {
      return undefined;
    }

    return this.getWalletSigner(this.activeWallet.address);
  }

  async getWalletProvider(wallet: string) {
    const foundWallet = find(this.user?.wallets || [], { address: wallet.toLowerCase() });

    if (!foundWallet) {
      throw new Error('Cannot find wallet');
    }

    const provider = await foundWallet.getProvider();

    await provider.getNetwork();

    return provider;
  }

  async getWalletSigner(wallet: string) {
    const provider = await this.getWalletProvider(wallet);

    return provider.getSigner();
  }

  getActiveWallet(): Wallet | undefined {
    return this.activeWallet;
  }

  setUser(user?: BasePrivyUser, wallets?: ConnectedWallet[]): void {
    if (!user || !wallets) {
      this.user = undefined;
      this.activeWallet = undefined;
      return;
    }

    this.user = {
      id: `privy:${user.id}`,
      type: UserType.privy,
      privyUser: user,
      wallets: wallets.map((wallet) => ({
        type: WalletType.embedded,
        address: wallet.address.toLowerCase(),
        getProvider: wallet.getEthersProvider,
      })),
    };

    const embeddedWallet = find(this.user.wallets, { type: WalletType.embedded });

    if (!this.activeWallet) {
      void this.setAndConnectActiveWallet(embeddedWallet?.address || wallets[0].address);
    }
  }

  setWalletsLabels(labels: AccountLabels): void {
    if (!this.user) {
      return;
    }

    const userWallets = this.user.wallets;

    this.user = {
      ...this.user,
      wallets: userWallets.map((wallet) => ({
        ...wallet,
        label: labels[wallet.address],
      })),
    };
  }
}
