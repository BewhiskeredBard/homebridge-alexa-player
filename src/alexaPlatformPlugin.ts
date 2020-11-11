import * as fs from 'fs';
import AlexaRemote from 'alexa-remote2';
import type { IndependentPlatformPlugin, Logging, PlatformConfig, API } from 'homebridge';
import { AccessoryFactory } from './accessoryFactory';

export class AlexaPlatformPlugin implements IndependentPlatformPlugin {
    public static readonly PLATFORM_NAME = 'AlexaPlayer';

    public constructor(logger: Logging, config: PlatformConfig, api: API) {
        const pluginVersion = (JSON.parse(fs.readFileSync(require.resolve('../package.json'), 'utf8')) as Record<string, unknown>).version as string;

        logger.info(`Running ${config.platform}-${pluginVersion} on homebridge-${api.serverVersion}.`);

        const alexa = new AlexaRemote();

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

                const accessoryFactory = new AccessoryFactory(logger, api, alexa);

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
