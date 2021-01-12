import type { PlatformConfig } from 'homebridge';

export const PLATFORM_NAME = 'AlexaPlayer';

export type AmazonDomain = 'amazon.com' | 'amazon.ca' | 'amazon.de' | 'amazon.es' | 'amazon.fr' | 'amazon.it' | 'amazon.co.jp' | 'amazon.co.uk';

export interface AlexaPlatformConfig extends PlatformConfig {
    platform: 'AlexaPlayer';
    amazonDomain: AmazonDomain;
    auth: {
        cookie?: string;
        proxy: {
            clientHost: string;
            port: number;
        };
    };
    screensAsTelevisions?: boolean;
}
