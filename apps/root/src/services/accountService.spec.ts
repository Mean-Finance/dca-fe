/* eslint-disable @typescript-eslint/unbound-method */
import { createMockInstance } from '@common/utils/tests';
import AccountService, { WALLET_SIGNATURE_KEY } from './accountService';
import Web3Service from './web3Service';
import { Wallet, WalletStatus, WalletType, User, UserStatus, Account } from '@types';
import { Web3Provider } from '@ethersproject/providers';
import { toWallet } from '@common/utils/accounts';
import { IProviderInfo } from '@common/utils/provider-info/types';
import MeanApiService from './meanApiService';
import { getConnectorData } from '@common/utils/wagmi';
import { Connector } from 'wagmi';

jest.mock('./web3Service');
jest.mock('@common/utils/provider-info', () => ({
  getProviderInfo: jest.fn(),
}));
jest.mock('@common/utils/wagmi', () => ({
  getConnectorData: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ethers: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ...jest.requireActual('ethers').ethers,
    providers: {
      Web3Provider: jest.fn(),
    },
  },
}));

const MockedWeb3Service = jest.mocked(Web3Service, { shallow: true });
const mockedGetConnectorData = jest.mocked(getConnectorData, { shallow: true });

describe('Account Service', () => {
  let web3Service: jest.MockedObject<Web3Service>;
  let accountService: AccountService;
  let activeWallet: Wallet;
  let user: User;
  let accounts: Account[];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let activeWalletProvider: Web3Provider;
  let getActiveWalletProvider;
  const mockedTodaySeconds = 1642439808;
  let setAccountCallbackMock: jest.Mock;

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    const mockedToday = new Date(mockedTodaySeconds * 1000);
    jest.useFakeTimers();
    jest.setSystemTime(mockedToday);

    web3Service = createMockInstance(MockedWeb3Service);

    accountService = new AccountService(web3Service);

    activeWalletProvider = {
      getNetwork: jest.fn(),
      getSigner: jest.fn().mockResolvedValue('active signer'),
    } as unknown as Web3Provider;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    getActiveWalletProvider = jest.fn().mockResolvedValue(activeWalletProvider);

    setAccountCallbackMock = jest.fn();

    web3Service.setAccountCallback = setAccountCallbackMock;

    activeWallet = {
      type: WalletType.external,
      address: '0xaddress',
      label: 'External wallet',
      getProvider: getActiveWalletProvider,
      status: WalletStatus.connected,
      isAuth: true,
      providerInfo: {
        id: 'metamask',
        type: 'metamask',
        check: 'false',
        name: 'Metamask',
        logo: '',
      },
    };

    accounts = [
      {
        id: '377ecf0f-008e-446a-8839-980deba4cee7',
        label: 'User label',
        labels: {},
        contacts: [],
        wallets: [
          {
            address: '0xaddress',
            isAuth: true,
          },
          {
            address: '0xSecondAddress',
            isAuth: false,
          },
        ],
      },
      {
        id: '50f9ef37-7c9a-4e28-a421-d73288e75236',
        label: 'Work user label',
        labels: {},
        contacts: [],
        wallets: [
          {
            address: '0xaddress',
            isAuth: true,
          },
        ],
      },
    ];

    user = {
      id: '377ecf0f-008e-446a-8839-980deba4cee7',
      wallets: [activeWallet, toWallet({ address: '0xSecondAddress', status: WalletStatus.disconnected })],
      status: UserStatus.loggedIn,
      label: 'User label',
    };

    accountService.user = user;

    accountService.activeWallet = activeWallet;

    accountService.accounts = accounts;

    accountService.signedWith = activeWallet;
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('setActiveWallet', () => {
    it('should call the connect method of the web3Service', async () => {
      await accountService.setActiveWallet('0xaddress');

      expect(setAccountCallbackMock).toHaveBeenCalledTimes(1);
      expect(setAccountCallbackMock).toHaveBeenCalledWith('0xaddress');
      expect(web3Service.connect).toHaveBeenCalledTimes(1);
      expect(web3Service.connect).toHaveBeenCalledWith(activeWalletProvider, undefined, undefined);
    });
  });

  describe('getActiveWalletProvider', () => {
    describe('when there is no active wallet', () => {
      it('should return undefined', async () => {
        accountService.activeWallet = undefined;
        const provider = await accountService.getActiveWalletProvider();

        expect(provider).toEqual(undefined);
      });
    });

    describe('when there is an active wallet', () => {
      it('should return the activeWalletProvider', async () => {
        const provider = await accountService.getActiveWalletProvider();
        expect(JSON.stringify(provider)).toEqual(JSON.stringify(activeWalletProvider));
      });
    });
  });

  describe('getActiveWalletSigner', () => {
    describe('when there is no active wallet', () => {
      it('should return undefined', async () => {
        accountService.activeWallet = undefined;
        const provider = await accountService.getActiveWalletSigner();

        expect(provider).toEqual(undefined);
      });
    });

    describe('when there is an active wallet', () => {
      it('should return the activeWalletProvider', async () => {
        const provider = await accountService.getActiveWalletSigner();

        expect(provider).toEqual('active signer');
      });
    });
  });

  describe('getWalletProvider', () => {
    describe('when the wallet is not to be found', () => {
      it('should throw an error', async () => {
        try {
          await accountService.getWalletProvider('unknown wallet');
          expect(1).toEqual(2);
        } catch (e) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(e).toEqual(Error('Cannot find wallet'));
        }
      });
    });

    describe('when the wallet is found', () => {
      it('should call the getNetwork method of the provider', async () => {
        await accountService.getWalletProvider('0xaddress');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(activeWalletProvider.getNetwork).toHaveBeenCalledTimes(1);
      });

      it('should return the provider', async () => {
        const provider = await accountService.getWalletProvider('0xaddress');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(provider).toEqual(activeWalletProvider);
      });
    });
  });

  describe('getWalletSigner', () => {
    describe('when the wallet is not to be found', () => {
      it('should throw an error', async () => {
        try {
          await accountService.getWalletSigner('unknown wallet');
          expect(1).toEqual(2);
        } catch (e) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(e).toEqual(Error('Cannot find wallet'));
        }
      });
    });

    describe('when the wallet is found', () => {
      it('should return the provider', async () => {
        const provider = await accountService.getWalletSigner('0xaddress');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(provider).toEqual('active signer');
      });
    });
  });

  describe('getWalletVerifyingSignature', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let localStorageSetItemSpy: jest.SpyInstance<void, [key: string, value: string], any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let localStorageGetItemSpy: jest.SpyInstance<string | null, [key: string], any>;
    let getWalletSignerMock: jest.Mock;
    let signMessageMock: jest.Mock;
    let tomorrow: Date;
    let today: Date;

    beforeEach(() => {
      signMessageMock = jest.fn().mockResolvedValue('signature');
      getWalletSignerMock = jest.fn().mockResolvedValue({
        signMessage: signMessageMock,
      });
      localStorageSetItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      localStorageGetItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      accountService.getWalletSigner = getWalletSignerMock;

      today = new Date();

      tomorrow = new Date();

      tomorrow.setDate(today.getDate() + 1);

      user = {
        id: '377ecf0f-008e-446a-8839-980deba4cee7',
        wallets: [activeWallet],
        status: UserStatus.loggedIn,
        label: 'User label',
      };

      accountService.user = user;

      localStorageGetItemSpy.mockReturnValue(null);
    });

    afterEach(() => {
      localStorageSetItemSpy.mockRestore();
      localStorageGetItemSpy.mockRestore();
    });

    describe('when there is no user', () => {
      it('should throw an error', async () => {
        accountService.user = undefined;
        try {
          await accountService.getWalletVerifyingSignature({});
          expect(1).toEqual(2);
        } catch (e) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(e).toEqual(Error('User not defined'));
        }
      });
    });

    describe('when force address is true and no address is provided', () => {
      it('should throw an error', async () => {
        try {
          await accountService.getWalletVerifyingSignature({ forceAddressMatch: true });
          expect(1).toEqual(2);
        } catch (e) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(e).toEqual(Error('Address should be provided for forceAddressMatch'));
        }
      });
    });

    describe('when there is a saved signature', () => {
      beforeEach(() => {
        localStorageGetItemSpy.mockReturnValue(
          JSON.stringify({
            id: '0xaddress',
            expiration: tomorrow.toString(),
            message: 'saved signature',
          })
        );

        accountService.user!.wallets = [
          activeWallet,
          toWallet({
            address: '0xaddress',
            status: WalletStatus.connected,
            isAuth: true,
            getProvider: jest.fn(),
            providerInfo: {} as IProviderInfo,
          }),
        ];
      });

      it('should use the saved signature', async () => {
        await accountService.getWalletVerifyingSignature({ address: '0xaddress' });

        expect(localStorageGetItemSpy).toHaveBeenCalledTimes(1);
        expect(localStorageGetItemSpy).toHaveBeenCalledWith(WALLET_SIGNATURE_KEY);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(accountService.user.signature.expiration).toEqual(tomorrow.toString());
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(accountService.user.signature.message).toEqual('saved signature');

        expect(signMessageMock).toHaveBeenCalledTimes(0);
        expect(localStorageSetItemSpy).toHaveBeenCalledTimes(0);
      });

      it('should not use the saved signature if the user id does not match', async () => {
        localStorageGetItemSpy.mockReturnValue(
          JSON.stringify({
            id: 'another id',
            expiration: tomorrow.toString(),
            message: 'saved signature',
          })
        );

        await accountService.getWalletVerifyingSignature({ address: '0xaddress' });

        expect(localStorageGetItemSpy).toHaveBeenCalledTimes(1);
        expect(localStorageGetItemSpy).toHaveBeenCalledWith(WALLET_SIGNATURE_KEY);
        expect(signMessageMock).toHaveBeenCalledTimes(1);
      });

      it('should not use the saved signature if the signature is expired', async () => {
        tomorrow.setDate(tomorrow.getDate() - 2);
        localStorageGetItemSpy.mockReturnValue(
          JSON.stringify({
            id: 'another id',
            expiration: tomorrow.toString(),
            message: 'saved signature',
          })
        );

        await accountService.getWalletVerifyingSignature({ address: '0xaddress' });

        expect(localStorageGetItemSpy).toHaveBeenCalledTimes(1);
        expect(localStorageGetItemSpy).toHaveBeenCalledWith(WALLET_SIGNATURE_KEY);
        expect(signMessageMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('when there is no saved signature', () => {
      describe('when updateSignature is false', () => {
        it('should ask for the user signature and save it by default', async () => {
          await accountService.getWalletVerifyingSignature({ address: '0xaddress', updateSignature: false });

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          expect(accountService.user.signature).toEqual(undefined);

          expect(signMessageMock).toHaveBeenCalledTimes(1);
          expect(signMessageMock).toHaveBeenCalledWith(`Sign in until ${tomorrow.toString()}`);
          expect(localStorageSetItemSpy).toHaveBeenCalledTimes(0);
        });
      });

      it('should ask for the user signature and save it by default', async () => {
        await accountService.getWalletVerifyingSignature({ address: '0xaddress' });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(accountService.user.signature.expiration).toEqual(tomorrow.toString());
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(accountService.user.signature.message).toEqual('signature');

        expect(signMessageMock).toHaveBeenCalledTimes(1);
        expect(signMessageMock).toHaveBeenCalledWith(`Sign in until ${tomorrow.toString()}`);
        expect(localStorageSetItemSpy).toHaveBeenCalledTimes(1);
        expect(localStorageSetItemSpy).toHaveBeenCalledWith(
          WALLET_SIGNATURE_KEY,
          JSON.stringify({
            id: '0xaddress',
            expiration: tomorrow.toString(),
            message: 'signature',
          })
        );
      });
    });

    it('should throw an error when there is no admin wallet', async () => {
      accountService.user!.wallets = [
        toWallet({ address: 'address1', status: WalletStatus.disconnected }),
        toWallet({ address: 'address2', status: WalletStatus.disconnected }),
      ];

      try {
        await accountService.getWalletVerifyingSignature({});
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('Address should be provided'));
      }
    });
  });

  describe('getWalletLinkSignature', () => {
    let getWalletSignerMock: jest.Mock;
    let signMessageMock: jest.Mock;
    let tomorrow: Date;
    let today: Date;

    beforeEach(() => {
      signMessageMock = jest.fn().mockResolvedValue('signature');
      getWalletSignerMock = jest.fn().mockResolvedValue({
        signMessage: signMessageMock,
      });
      accountService.getWalletSigner = getWalletSignerMock;

      today = new Date();

      tomorrow = new Date();

      tomorrow.setMinutes(today.getMinutes() + 30);

      user = {
        id: '377ecf0f-008e-446a-8839-980deba4cee7',
        wallets: [activeWallet],
        status: UserStatus.loggedIn,
        label: 'User label',
      };

      accountService.user = user;
    });

    describe('when there is no user', () => {
      it('should throw an error', async () => {
        accountService.user = undefined;
        try {
          await accountService.getWalletLinkSignature({
            address: '0xSecondAddress',
          });
          expect(1).toEqual(2);
        } catch (e) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(e).toEqual(Error('User not defined'));
        }
      });
    });

    it('should ask for the user signature', async () => {
      const signature = await accountService.getWalletLinkSignature({ address: '0xSecondAddress' });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(signature.expiration).toEqual(tomorrow.toString());
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(signature.message).toEqual('signature');

      expect(signMessageMock).toHaveBeenCalledTimes(1);
      expect(signMessageMock).toHaveBeenCalledWith(
        `By signing this message you are authorizing the account User label (377ecf0f-008e-446a-8839-980deba4cee7) to add this wallet to it. This signature will expire on ${tomorrow.toString()}.`
      );
    });
  });

  describe('changeWalletAdmin', () => {
    let getWalletLinkSignature: jest.Mock;
    let modifyWalletMock: jest.Mock;
    let tomorrow: Date;
    let today: Date;

    beforeEach(() => {
      today = new Date();

      tomorrow = new Date();

      tomorrow.setMinutes(today.getMinutes() + 30);

      modifyWalletMock = jest.fn();

      web3Service.getMeanApiService.mockReturnValue({
        modifyWallet: modifyWalletMock,
      } as unknown as MeanApiService);

      getWalletLinkSignature = jest.fn().mockResolvedValue({
        expiration: tomorrow.toString(),
        message: 'signature',
      });
      accountService.getWalletLinkSignature = getWalletLinkSignature;
    });

    describe('when the user cannot be found', () => {
      it('should throw an error', async () => {
        accountService.user = undefined;
        try {
          await accountService.changeWalletAdmin({
            address: '0xanother',
            userId: '377ecf0f-008e-446a-8839-980deba4cee7',
            isAuth: true,
          });
          expect(1).toEqual(2);
        } catch (e) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(e).toEqual(Error('Wallet not found'));
        }
      });
    });

    describe('when the wallet cannot be found', () => {
      it('should throw an error', async () => {
        accountService.user = undefined;
        try {
          await accountService.changeWalletAdmin({
            address: '0xSecondAddress',
            userId: 'another id',
            isAuth: true,
          });
          expect(1).toEqual(2);
        } catch (e) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(e).toEqual(Error('Account not found'));
        }
      });
    });

    describe('when setting a wallet as auth method', () => {
      it('should send the request to the api and modify the local wallet', async () => {
        await accountService.changeWalletAdmin({
          address: '0xSecondAddress',
          isAuth: true,
          userId: '377ecf0f-008e-446a-8839-980deba4cee7',
        });

        expect(modifyWalletMock).toHaveBeenCalledTimes(1);
        expect(modifyWalletMock).toHaveBeenCalledWith({
          address: '0xSecondAddress',
          walletConfig: {
            isAuth: true,
            signature: 'signature',
            expiration: tomorrow.toString(),
          },
          accountId: '377ecf0f-008e-446a-8839-980deba4cee7',
        });
        expect(getWalletLinkSignature).toHaveBeenCalledTimes(1);
        expect(getWalletLinkSignature).toHaveBeenCalledWith({ address: '0xSecondAddress' });

        expect(accountService.user?.wallets[1].isAuth).toEqual(true);
        expect(accountService.accounts[0].wallets[1].isAuth).toEqual(true);
      });
    });

    describe('when removing a wallet as auth method', () => {
      it('should send the request to the api and modify the local wallet', async () => {
        await accountService.changeWalletAdmin({
          address: '0xSecondAddress',
          isAuth: false,
          userId: '377ecf0f-008e-446a-8839-980deba4cee7',
        });

        expect(modifyWalletMock).toHaveBeenCalledTimes(1);
        expect(modifyWalletMock).toHaveBeenCalledWith({
          address: '0xSecondAddress',
          walletConfig: { isAuth: false },
          accountId: '377ecf0f-008e-446a-8839-980deba4cee7',
        });
        expect(getWalletLinkSignature).toHaveBeenCalledTimes(0);

        expect(accountService.user?.wallets[1].isAuth).toEqual(false);
        expect(accountService.accounts[0].wallets[1].isAuth).toEqual(false);
      });
    });
  });

  describe('updateWallet', () => {
    let connector: Connector | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let web3ProviderMocked: Web3Provider;
    beforeEach(() => {
      connector = {} as unknown as Connector;

      web3ProviderMocked = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0xexternal'),
        }),
      } as unknown as Web3Provider;

      mockedGetConnectorData.mockResolvedValue({
        provider: web3ProviderMocked,
        providerInfo: 'walletProviderInfo' as unknown as IProviderInfo,
        address: '0xSecondAddress',
      } as Awaited<ReturnType<typeof getConnectorData>>);
    });

    it('should thow if the connector is not existent', async () => {
      try {
        await accountService.updateWallet({});
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('Connector not defined'));
      }
    });

    it('should thow if there is no logged in user', async () => {
      accountService.user = undefined;
      try {
        await accountService.updateWallet({});
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('User is not connected'));
      }
    });

    it('should update the active wallet and update the user wallet', async () => {
      await accountService.updateWallet({ connector });

      expect(accountService.activeWallet).toEqual({
        ...toWallet({
          address: '0xSecondAddress',
          status: WalletStatus.connected,
          providerInfo: 'walletProviderInfo' as unknown as IProviderInfo,
          isAuth: true,
          getProvider: () => Promise.resolve(web3ProviderMocked),
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        getProvider: expect.any(Function),
      });
      expect(accountService.user?.wallets[1]).toEqual({
        ...toWallet({
          address: '0xSecondAddress',
          status: WalletStatus.connected,
          providerInfo: 'walletProviderInfo' as unknown as IProviderInfo,
          isAuth: true,
          getProvider: () => Promise.resolve(web3ProviderMocked),
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        getProvider: expect.any(Function),
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const activeWalletTestProvider = await accountService.activeWallet!.getProvider();
      expect(activeWalletTestProvider).toEqual(web3ProviderMocked);
    });
  });

  describe('linkWallet', () => {
    let connector: Connector | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let web3ProviderMocked: Web3Provider;
    let linkWalletMock: jest.Mock;
    let signMessageMock: jest.Mock;
    let tomorrow: Date;
    let today: Date;

    beforeEach(() => {
      connector = {} as unknown as Connector;

      today = new Date();

      tomorrow = new Date();

      tomorrow.setMinutes(today.getMinutes() + 30);

      web3ProviderMocked = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0xexternal'),
        }),
      } as unknown as Web3Provider;

      signMessageMock = jest.fn().mockResolvedValue('signature');

      linkWalletMock = jest.fn();

      web3Service.getMeanApiService.mockReturnValue({
        linkWallet: linkWalletMock,
      } as unknown as MeanApiService);

      mockedGetConnectorData.mockResolvedValue({
        provider: web3ProviderMocked,
        providerInfo: 'walletProviderInfo' as unknown as IProviderInfo,
        address: '0xThirdAddress',
        signer: {
          signMessage: signMessageMock,
        },
      } as unknown as Awaited<ReturnType<typeof getConnectorData>>);
    });

    it('should thow if the connector is not existent', async () => {
      try {
        await accountService.linkWallet({
          isAuth: false,
        });
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('Connector not defined'));
      }
    });

    it('should thow if there is no logged in user', async () => {
      accountService.user = undefined;
      try {
        await accountService.linkWallet({
          isAuth: false,
        });
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('User is not connected'));
      }
    });

    describe('when setting the wallet as auth method', () => {
      it('should make the wallet sign a message, call the api and link the wallet', async () => {
        await accountService.linkWallet({ connector, isAuth: true });

        expect(signMessageMock).toHaveBeenCalledTimes(1);
        expect(signMessageMock).toHaveBeenCalledWith(
          `By signing this message you are authorizing the account User label (377ecf0f-008e-446a-8839-980deba4cee7) to add this wallet to it. This signature will expire on ${tomorrow.toString()}.`
        );

        expect(linkWalletMock).toHaveBeenCalledTimes(1);
        expect(linkWalletMock).toHaveBeenCalledWith({
          wallet: {
            address: '0xThirdAddress',
            isAuth: true,
            signature: 'signature',
            expiration: tomorrow.toString(),
          },
        });
        expect(accountService.user?.wallets[2]).toEqual({
          ...toWallet({
            address: '0xThirdAddress',
            status: WalletStatus.connected,
            providerInfo: 'walletProviderInfo' as unknown as IProviderInfo,
            isAuth: true,
            getProvider: () => Promise.resolve(web3ProviderMocked),
          }),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          getProvider: expect.any(Function),
        });
        expect(accountService.accounts[0].wallets[2]).toEqual({
          address: '0xThirdAddress',
          isAuth: true,
        });
      });
    });

    describe('when not setting the wallet as auth method', () => {
      it('should not make the wallet sing, call the api and link the wallet', async () => {
        await accountService.linkWallet({ connector, isAuth: false });

        expect(linkWalletMock).toHaveBeenCalledTimes(1);
        expect(linkWalletMock).toHaveBeenCalledWith({
          wallet: {
            address: '0xThirdAddress',
            isAuth: false,
          },
        });
        expect(accountService.user?.wallets[2]).toEqual({
          ...toWallet({
            address: '0xThirdAddress',
            status: WalletStatus.connected,
            providerInfo: 'walletProviderInfo' as unknown as IProviderInfo,
            isAuth: false,
            getProvider: () => Promise.resolve(web3ProviderMocked),
          }),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          getProvider: expect.any(Function),
        });
        expect(accountService.accounts[0].wallets[2]).toEqual({
          address: '0xThirdAddress',
          isAuth: false,
        });
      });
    });
  });

  describe('createUser', () => {
    let createAccountMock: jest.Mock;
    let getWalletVerifyingSignatureMock: jest.Mock;
    let changeUserMock: jest.Mock;

    beforeEach(() => {
      getWalletVerifyingSignatureMock = jest.fn().mockResolvedValue('signature');

      createAccountMock = jest.fn().mockResolvedValue({ accountId: 'new-id' });

      changeUserMock = jest.fn();

      web3Service.getMeanApiService.mockReturnValue({
        createAccount: createAccountMock,
      } as unknown as MeanApiService);
      accountService.changeUser = changeUserMock;
      accountService.getWalletVerifyingSignature = getWalletVerifyingSignatureMock;
    });

    it('should thow if there is no active wallet', async () => {
      accountService.activeWallet = undefined;
      try {
        await accountService.createUser({
          label: 'new user',
        });
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('Should be an active wallet for this'));
      }
    });

    it('should thow if there is no logged in user', async () => {
      accountService.user = undefined;
      try {
        await accountService.createUser({
          label: 'new user',
        });
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('User is not connected'));
      }
    });

    it('should create a user and set it on the service', async () => {
      await accountService.createUser({
        label: 'new user',
      });

      expect(createAccountMock).toHaveBeenCalledTimes(1);
      expect(createAccountMock).toHaveBeenCalledWith({
        label: 'new user',
      });

      expect(getWalletVerifyingSignatureMock).toHaveBeenCalledTimes(1);
      expect(getWalletVerifyingSignatureMock).toHaveBeenCalledWith({
        forceAddressMatch: true,
        address: '0xaddress',
      });
      expect(changeUserMock).toHaveBeenCalledTimes(1);
      expect(changeUserMock).toHaveBeenCalledWith('new-id');
      expect(accountService.accounts[2]).toEqual({
        id: 'new-id',
        label: 'new user',
        labels: {},
        contacts: [],
        wallets: [
          {
            address: '0xaddress',
            isAuth: true,
          },
        ],
      });
      expect(accountService.accounts[2].wallets[0]).toEqual({
        address: '0xaddress',
        isAuth: true,
      });
    });
  });

  describe('logInUser', () => {
    let connector: Connector | undefined;
    let getAccountsMock: jest.Mock;
    let setActiveWalletMock: jest.Mock;
    let openNewAccountModalMock: jest.Mock;

    beforeEach(() => {
      connector = {} as unknown as Connector;

      getAccountsMock = jest.fn();

      setActiveWalletMock = jest.fn();

      openNewAccountModalMock = jest.fn();

      web3Service.getMeanApiService.mockReturnValue({
        getAccounts: getAccountsMock,
      } as unknown as MeanApiService);

      mockedGetConnectorData.mockResolvedValue({
        provider: activeWalletProvider,
        providerInfo: {
          id: 'metamask',
          type: 'metamask',
          check: 'false',
          name: 'Metamask',
          logo: '',
        },
        address: '0xaddress',
      } as unknown as Awaited<ReturnType<typeof getConnectorData>>);

      accountService.user = undefined;
      accountService.activeWallet = undefined;
      accountService.accounts = [];

      accountService.setActiveWallet = setActiveWalletMock;
      accountService.openNewAccountModal = openNewAccountModalMock;
    });

    it('should thow if the connector is not existent', async () => {
      try {
        await accountService.logInUser();
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('Connector not defined'));
      }
    });

    describe('when the wallet has accounts on the DB', () => {
      beforeEach(() => {
        getAccountsMock.mockResolvedValue({
          accounts: [
            {
              id: '377ecf0f-008e-446a-8839-980deba4cee7',
              label: 'User label',
              labels: {},
              contacts: [],
              wallets: [
                {
                  address: '0xaddress',
                  isAuth: true,
                },
                {
                  address: '0xSecondAddress',
                  isAuth: false,
                },
              ],
            },
            {
              id: '50f9ef37-7c9a-4e28-a421-d73288e75236',
              label: 'Work user label',
              labels: {},
              contacts: [],
              wallets: [
                {
                  address: '0xaddress',
                  isAuth: true,
                },
              ],
            },
          ],
        });
      });

      it('should log in the wallet and set the account', async () => {
        await accountService.logInUser(connector);

        expect(setActiveWalletMock).toHaveBeenCalledTimes(1);
        expect(setActiveWalletMock).toHaveBeenCalledWith('0xaddress');

        expect(openNewAccountModalMock).toHaveBeenCalledTimes(0);

        expect(getAccountsMock).toHaveBeenCalledTimes(1);
        expect(accountService.accounts).toEqual([
          {
            id: '377ecf0f-008e-446a-8839-980deba4cee7',
            label: 'User label',
            labels: {},
            contacts: [],
            wallets: [
              {
                address: '0xaddress',
                isAuth: true,
              },
              {
                address: '0xSecondAddress',
                isAuth: false,
              },
            ],
          },
          {
            id: '50f9ef37-7c9a-4e28-a421-d73288e75236',
            label: 'Work user label',
            labels: {},
            contacts: [],
            wallets: [
              {
                address: '0xaddress',
                isAuth: true,
              },
            ],
          },
        ]);
        expect(accountService.user).toEqual({
          id: '377ecf0f-008e-446a-8839-980deba4cee7',
          wallets: [
            {
              ...activeWallet,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              getProvider: expect.any(Function),
              label: undefined,
            },
            toWallet({ address: '0xSecondAddress', status: WalletStatus.disconnected }),
          ],
          status: UserStatus.loggedIn,
          label: 'User label',
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const walletProvider = await accountService.user?.wallets[0].getProvider();

        expect(walletProvider).toEqual(activeWalletProvider);
      });
    });

    describe('when the wallet does not have accounts on the DB', () => {
      beforeEach(() => {
        getAccountsMock.mockResolvedValue({ accounts: [] });
      });
      it('should log in the wallet and set the account as pending and open the new account modal', async () => {
        await accountService.logInUser(connector);

        expect(setActiveWalletMock).toHaveBeenCalledTimes(1);
        expect(setActiveWalletMock).toHaveBeenCalledWith('0xaddress');

        expect(openNewAccountModalMock).toHaveBeenCalledTimes(1);

        expect(getAccountsMock).toHaveBeenCalledTimes(1);
        expect(accountService.accounts).toEqual([]);
        expect(accountService.user).toEqual({
          id: 'pending',
          label: 'New Account',
          wallets: [
            {
              ...activeWallet,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              getProvider: expect.any(Function),
              label: undefined,
            },
          ],
          status: UserStatus.loggedIn,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const walletProvider = await accountService.user?.wallets[0].getProvider();

        expect(walletProvider).toEqual(activeWalletProvider);
      });
    });
  });

  describe('changeUser', () => {
    let setActiveWalletMock: jest.Mock;

    beforeEach(() => {
      setActiveWalletMock = jest.fn();

      accountService.setActiveWallet = setActiveWalletMock;
    });

    it('should thow if the user is not found', async () => {
      try {
        await accountService.changeUser('non-existent-id');
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('User is not connected'));
      }
    });

    it('should thow if there is no active wallet', async () => {
      accountService.activeWallet = undefined;
      try {
        await accountService.changeUser('50f9ef37-7c9a-4e28-a421-d73288e75236');
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('Active wallet not found'));
      }
    });
    it('should thow if there is no signed in wallet', async () => {
      accountService.signedWith = undefined;
      try {
        await accountService.changeUser('50f9ef37-7c9a-4e28-a421-d73288e75236');
        expect(1).toEqual(2);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toEqual(Error('Signed in wallet not found'));
      }
    });

    describe('when the active wallet is in the new user wallets', () => {
      it('should not change the active wallet', async () => {
        await accountService.changeUser('50f9ef37-7c9a-4e28-a421-d73288e75236');

        expect(setActiveWalletMock).toHaveBeenCalledTimes(0);
      });
    });

    describe('when the active wallet is not in the new user wallets', () => {
      beforeEach(() => {
        accountService.activeWallet = toWallet({ address: '0xSecondAddress', status: WalletStatus.disconnected });
      });

      it('should change the active wallet to the signin wallet', async () => {
        await accountService.changeUser('50f9ef37-7c9a-4e28-a421-d73288e75236');

        expect(setActiveWalletMock).toHaveBeenCalledTimes(1);
        expect(setActiveWalletMock).toHaveBeenCalledWith('0xaddress');
      });
    });

    it('change the current user', async () => {
      await accountService.changeUser('50f9ef37-7c9a-4e28-a421-d73288e75236');

      expect(accountService.user).toEqual({
        id: '50f9ef37-7c9a-4e28-a421-d73288e75236',
        wallets: [activeWallet],
        status: UserStatus.loggedIn,
        label: 'Work user label',
      });
    });
  });
});
/* eslint-enable @typescript-eslint/unbound-method */
