import { createMockInstance } from '@common/utils/tests';
import md5 from 'md5';
import { MEAN_PROXY_PANEL_URL } from '@constants';
import mixpanel, { Mixpanel } from 'mixpanel-browser';
import EventService from './eventService';
import ProviderService from './providerService';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('mixpanel-browser');
jest.mock('./providerService');
jest.mock('md5');

const MockedProviderService = jest.mocked(ProviderService, { shallow: true });
const MockedMd5 = jest.mocked(md5, { shallow: true });
const MockedMixpanelBrowser = jest.mocked(mixpanel, { shallow: true });

describe('Event Service', () => {
  let eventService: EventService;
  let providerService: jest.MockedObject<ProviderService>;
  let setConfigMock: jest.Mock;
  let trackMock: jest.Mock;

  beforeEach(() => {
    MockedMd5.mockImplementation((value: string) => `md5-${value}`);
    providerService = createMockInstance(MockedProviderService);
    providerService.getAddress.mockResolvedValue('account');
    providerService.getNetwork.mockResolvedValue({ chainId: 10, defaultProvider: false });
    setConfigMock = jest.fn();
    trackMock = jest.fn();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    MockedMixpanelBrowser.init.mockReturnValue({
      set_config: setConfigMock,
      track: trackMock,
    } as unknown as Mixpanel);
    process.env = {
      MIXPANEL_TOKEN: 'MIXPANEL_TOKEN',
    };
    eventService = new EventService(providerService as unknown as ProviderService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('it should init mixpanel browser and set config', () => {
      expect(MockedMixpanelBrowser.init).toHaveBeenCalledTimes(1);
      expect(MockedMixpanelBrowser.init).toHaveBeenCalledWith(
        'MIXPANEL_TOKEN',
        { api_host: MEAN_PROXY_PANEL_URL },
        ' '
      );
      expect(setConfigMock).toHaveBeenCalledTimes(1);
      expect(setConfigMock).toHaveBeenCalledWith({ persistence: 'localStorage', ignore_dnt: true });
    });
  });

  describe('getIdentifier', () => {
    test('it should generate an md5 id from the account if present', async () => {
      const result = await eventService.getIdentifier();

      expect(result).toEqual('md5-account');
    });
  });

  describe('trackEvent', () => {
    test('it should call mixpanel to track the event and expand all data', async () => {
      await eventService.trackEvent('Action to track', { someProp: 'someValue' });
      expect(trackMock).toHaveBeenCalledTimes(1);
      expect(trackMock).toHaveBeenCalledWith('Action to track', {
        chainId: 10,
        chainName: 'Optimism',
        someProp: 'someValue',
      });
    });

    test('it should fail gracefully when track fails', async () => {
      trackMock.mockImplementation(() => {
        throw new Error('error tracking');
      });
      await eventService.trackEvent('Action to track', { someProp: 'someValue' });
      expect(trackMock).toHaveBeenCalledTimes(1);
      expect(trackMock).toHaveBeenCalledWith('Action to track', {
        chainId: 10,
        chainName: 'Optimism',
        someProp: 'someValue',
      });
    });
  });
});
