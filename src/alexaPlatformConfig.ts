import type { PlatformConfig } from 'homebridge';

export const PLATFORM_NAME = 'AlexaPlayer';

export interface AlexaPlatformConfig extends PlatformConfig {
    platform: 'AlexaPlayer';
    auth: {
        cookie?: string;
        proxy: {
            clientHost: string;
            port: number;
        };
    };
}
