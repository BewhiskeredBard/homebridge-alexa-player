import * as fs from 'fs';
import AlexaRemote from 'alexa-remote2';
import type { IndependentPlatformPlugin, Logging, PlatformConfig, API } from 'homebridge';
import { AccessoryFactory } from './accessoryFactory';
import { DeviceCapabilitiesPredicate, DeviceFamilyPredicate } from './devicePredicate';
import { AccessoryInfoServiceInitializer, SmartSpeakerServiceInitializer } from './serviceInitializer';

export class AlexaPlatformPlugin implements IndependentPlatformPlugin {
    public static readonly PLATFORM_NAME = 'AlexaPlayer';

    // Example device families:
    // - ECHO (echo)
    // - TABLET (fire tablet)
    // - MSHOP (mobile shopping app)
    // - THIRD_PARTY_AVS_MEDIA_DISPLAY (Sonos)
    // - THIRD_PARTY_AVS_SONOS_BOOTLEG (Sonos)
    public static readonly ALLOWED_DEVICE_FAMILIES = ['ECHO'];

    // Speaker-relevant device capabilities:
    // - VOLUME_SETTING (mShop, fire tablet, echo, Sonos)
    // - SOUND_SETTINGS (fire tablet, echo)
    // - AUDIO_CONTROLS (echo, Sonos Beam)
    // - AUDIO_PLAYER (echo, Sonos)
    // - DS_VOLUME_SETTING (echo)
    public static readonly REQUIRED_DEVICE_CAPABILTIES = ['VOLUME_SETTING', 'AUDIO_CONTROLS'];

    public constructor(logger: Logging, config: PlatformConfig, api: API) {
        const pluginVersion = (JSON.parse(fs.readFileSync(require.resolve('../package.json'), 'utf8')) as Record<string, unknown>).version as string;

        logger.info(`Running ${config.platform}-${pluginVersion} on homebridge-${api.serverVersion}.`);

        const alexa = new AlexaRemote();
        const deviceFilters = [
            new DeviceFamilyPredicate(logger, ...AlexaPlatformPlugin.ALLOWED_DEVICE_FAMILIES),
            new DeviceCapabilitiesPredicate(logger, ...AlexaPlatformPlugin.REQUIRED_DEVICE_CAPABILTIES),
        ];
        const serviceInitializers = [new AccessoryInfoServiceInitializer(logger, api.hap, alexa), new SmartSpeakerServiceInitializer(logger, api.hap, alexa)];
        const accessoryFactory = new AccessoryFactory(api, alexa, deviceFilters, serviceInitializers);

        alexa.init(
            {
                useWsMqtt: true,
                logger: (message: string) => logger.debug(message),
                proxyOwnIp: 'localhost',
                // TODO: Add config schema validation.
                cookie: (config as { auth?: { cookie?: string } }).auth?.cookie as string,
                // TODO: Move the remaining entries to config…
                alexaServiceHost: 'pitangui.amazon.com',
                amazonPage: 'amazon.com',
                amazonPageProxyLanguage: 'en_US',
                acceptLanguage: 'en-US',
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                cookieRefreshInterval: 7 * 24 * 60 * 1000,
            },
            error => {
                if (error) {
                    logger.error('Failed to initialize.', error);
                    return;
                }

                accessoryFactory
                    .createAccessories()
                    .then(accessories => {
                        api.publishExternalAccessories('homebridge-alexa-player', accessories);
                    })
                    .catch(err => {
                        logger.error(err);
                    });
            },
        );
    }
}
