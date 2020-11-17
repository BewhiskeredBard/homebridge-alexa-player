import type { API, PluginInitializer } from 'homebridge';
import { PLATFORM_NAME } from './alexaPlatformConfig';
import { AlexaPlatformPlugin } from './alexaPlatformPlugin';

const init: PluginInitializer = (api: API): void => {
    api.registerPlatform(PLATFORM_NAME, AlexaPlatformPlugin);
};

export default init;
