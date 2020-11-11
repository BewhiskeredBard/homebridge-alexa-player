import type { API, PluginInitializer } from 'homebridge';
import { AlexaPlatformPlugin } from './alexaPlatformPlugin';

const init: PluginInitializer = (api: API): void => {
    api.registerPlatform(AlexaPlatformPlugin.PLATFORM_NAME, AlexaPlatformPlugin);
};

export default init;
