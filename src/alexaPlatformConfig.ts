import type { PlatformConfig } from 'homebridge';

export const PLATFORM_NAME = 'AlexaPlayer';

export type AmazonRegions = 'amazon.com' | 'amazon.de' | 'amazon.es' | 'amazon.fr' | 'amazon.it' | 'amazon.co.jp' | 'amazon.co.uk';

export interface AlexaPlatformConfig extends PlatformConfig {
    platform: 'AlexaPlayer';
    auth: {
        cookie?: string;
        region: AmazonRegions;
        proxy: {
            clientHost: string;
            port: number;
        };
    };
    screensAsTelevisions?: boolean;
}
