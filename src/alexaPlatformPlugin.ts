import * as fs from 'fs';
import Ajv from 'ajv';
import AlexaRemote from 'alexa-remote2';
import type { IndependentPlatformPlugin, Logging, PlatformConfig, API } from 'homebridge';
import { AccessoryFactory } from './accessoryFactory';
import { AlexaPlatformConfig } from './alexaPlatformConfig';
import { DeviceCapabilitiesPredicate, DeviceFamilyPredicate } from './devicePredicate';
import { AccessoryInfoServiceInitializer, SmartSpeakerServiceInitializer } from './serviceInitializer';

export class AlexaPlatformPlugin implements IndependentPlatformPlugin {
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

    private static readonly PROXY_SERVICE_HOST_DEFAULT = 'amazon.com';
    private static readonly PROXY_LANGUAGE = 'en_US';
    private static readonly SERVICE_HOST_DEFAULT = 'pitangui.amazon.com';
    private static readonly SERVICE_LANGUAGE = 'en-US';

    public constructor(logger: Logging, config: PlatformConfig, api: API) {
        const pluginVersion = (JSON.parse(fs.readFileSync(require.resolve('../package.json'), 'utf8')) as Record<string, unknown>).version as string;

        logger.info(`Running ${config.platform}-${pluginVersion} on homebridge-${api.serverVersion}.`);

        try {
            if (this.validateConfig(this.getSchema(), config)) {
                const alexa = new AlexaRemote();
                const deviceFilters = [
                    new DeviceFamilyPredicate(logger, ...AlexaPlatformPlugin.ALLOWED_DEVICE_FAMILIES),
                    new DeviceCapabilitiesPredicate(logger, ...AlexaPlatformPlugin.REQUIRED_DEVICE_CAPABILTIES),
                ];
                const serviceInitializers = [
                    new AccessoryInfoServiceInitializer(logger, api.hap, alexa),
                    new SmartSpeakerServiceInitializer(logger, api.hap, alexa),
                ];
                const accessoryFactory = new AccessoryFactory(api, alexa, deviceFilters, serviceInitializers);

                alexa.init(
                    {
                        useWsMqtt: true,
                        logger: (message: string) => logger.debug(message),
                        cookie: config.auth?.cookie,
                        proxyOwnIp: config.auth.proxy.clientHost,
                        proxyPort: config.auth.proxy.port,
                        // TODO: Move the remaining entries to config…
                        alexaServiceHost: AlexaPlatformPlugin.SERVICE_HOST_DEFAULT,
                        amazonPage: AlexaPlatformPlugin.PROXY_SERVICE_HOST_DEFAULT,
                        amazonPageProxyLanguage: AlexaPlatformPlugin.PROXY_LANGUAGE,
                        acceptLanguage: AlexaPlatformPlugin.SERVICE_LANGUAGE,
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
        } catch (e) {
            logger.error(e);
        }
    }

    private validateConfig(schema: Record<string, unknown>, config: PlatformConfig): config is AlexaPlatformConfig {
        const ajv = new Ajv();
        const isValid = ajv.validate(schema, config) as boolean;

        if (!isValid && ajv.errors && 0 < ajv.errors.length) {
            const error = ajv.errors[0];
            const message = `Configuration error: config${error.dataPath} ${error.message || ''}`;

            throw new Error(message);
        }

        return true;
    }

    private getSchema(): Record<string, unknown> {
        try {
            const schemaPath = require.resolve('../config.schema.json');
            const file = fs.readFileSync(schemaPath, 'utf8');
            const schema = JSON.parse(file) as Record<string, unknown>;

            return schema.schema as Record<string, unknown>;
        } catch (e: unknown) {
            let message = 'Unable to read/parse configuration schema';

            if (this.hasMessage(e)) {
                message = `${message}: ${e.message}`;
            }

            throw new Error(message);
        }
    }

    private hasMessage(error: unknown): error is { message: string } {
        return 'object' === typeof error && null !== error && 'message' in error;
    }
}