import * as fs from 'fs';
import { version as NODE_VERSION } from 'process';
import Ajv from 'ajv';
import AlexaRemote from 'alexa-remote2';
import type { IndependentPlatformPlugin, Logging, PlatformConfig, API } from 'homebridge';
import { AccessoryFactory } from './accessoryFactory';
import { AlexaBridge } from './alexaBridge';
import { AlexaPlatformConfig } from './alexaPlatformConfig';
import {
    CurrentMediaStateInitializer,
    FirmwareRevisionInitializer,
    ManufacturerInitializer,
    ModelInitializer,
    MuteInitializer,
    NameInitializer,
    SerialNumberInitializer,
    TargetMediaStateInitializer,
    VolumeInitializer,
} from './characteristicInitializer';
import { DeviceCapabilitiesPredicate, DeviceFamilyPredicate } from './devicePredicate';
import {
    AccessoryInfoServiceInitializer,
    SmartSpeakerServiceInitializer,
    TelevisionServiceInitializer,
    TelevisionSpeakerServiceInitializer,
} from './serviceInitializer';

export class AlexaPlatformPlugin implements IndependentPlatformPlugin {
    // Example device families:
    // - ECHO (echo)
    // - TABLET (fire tablet)
    // - MSHOP (mobile shopping app)
    // - THIRD_PARTY_AVS_MEDIA_DISPLAY (Sonos)
    // - THIRD_PARTY_AVS_SONOS_BOOTLEG (Sonos)
    public static readonly ALLOWED_DEVICE_FAMILIES = ['ECHO', 'KNIGHT'];

    // Speaker-relevant device capabilities:
    // - VOLUME_SETTING (mShop, fire tablet, echo, Sonos)
    // - SOUND_SETTINGS (fire tablet, echo)
    // - AUDIO_CONTROLS (echo, Sonos Beam)
    // - AUDIO_PLAYER (echo, Sonos)
    // - DS_VOLUME_SETTING (echo)
    public static readonly REQUIRED_DEVICE_CAPABILTIES = ['DS_VOLUME_SETTING', 'AUDIO_PLAYER'];

    private static readonly PROXY_LANGUAGE = 'en_US';
    private static readonly SERVICE_LANGUAGE = 'en-US';

    public constructor(logger: Logging, config: PlatformConfig, api: API) {
        const npmPackage = JSON.parse(fs.readFileSync(require.resolve('../package.json'), 'utf8')) as Record<string, unknown>;

        logger.info(`Running ${npmPackage.name as string}-v${npmPackage.version as string} with homebridge-v${api.serverVersion} on node-${NODE_VERSION}.`);

        try {
            if (this.validateConfig(this.getSchema(), config)) {
                const alexaRemote = new AlexaRemote();
                const alexaBridge = new AlexaBridge(logger, api.hap, alexaRemote);
                const deviceFilters = [
                    new DeviceFamilyPredicate(logger, ...AlexaPlatformPlugin.ALLOWED_DEVICE_FAMILIES),
                    new DeviceCapabilitiesPredicate(logger, ...AlexaPlatformPlugin.REQUIRED_DEVICE_CAPABILTIES),
                ];
                const serviceInitializers = [
                    new AccessoryInfoServiceInitializer(api.hap, config),
                    new SmartSpeakerServiceInitializer(api.hap, config),
                    new TelevisionServiceInitializer(api.hap, config),
                    new TelevisionSpeakerServiceInitializer(api.hap, config),
                ];
                const characteristicInitializers = [
                    new CurrentMediaStateInitializer(logger, api.hap, alexaBridge),
                    new TargetMediaStateInitializer(logger, api.hap, alexaBridge),
                    new MuteInitializer(logger, api.hap, alexaBridge),
                    new VolumeInitializer(logger, api.hap, alexaBridge),
                    new ManufacturerInitializer(logger, api.hap, alexaBridge),
                    new ModelInitializer(logger, api.hap, alexaBridge),
                    new FirmwareRevisionInitializer(logger, api.hap, alexaBridge),
                    new NameInitializer(logger, api.hap, alexaBridge),
                    new SerialNumberInitializer(logger, api.hap, alexaBridge),
                ];
                const accessoryFactory = new AccessoryFactory(logger, api, alexaRemote, deviceFilters, serviceInitializers, characteristicInitializers);

                alexaRemote.init(
                    {
                        useWsMqtt: true,
                        amazonPage: config.amazonDomain,
                        alexaServiceHost: `alexa.${config.amazonDomain}`,
                        cookie: config.auth?.cookie,
                        proxyOwnIp: config.auth.proxy.clientHost,
                        proxyPort: config.auth.proxy.port,
                        // TODO: Move the remaining entries to config…
                        amazonPageProxyLanguage: AlexaPlatformPlugin.PROXY_LANGUAGE,
                        acceptLanguage: AlexaPlatformPlugin.SERVICE_LANGUAGE,
                    },
                    error => {
                        if (error) {
                            logger.error('Failed to initialize.', error);
                            return;
                        }

                        if (!config.auth.cookie && alexaRemote.cookie) {
                            logger.warn(
                                `Alexa cookie retrieved successfully. Save this value in the Homebridge AlexaPlayer configuration as auth.cookie, but never share it with anyone: ${alexaRemote.cookie}`,
                            );
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
