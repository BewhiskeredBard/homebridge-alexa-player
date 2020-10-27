import type { API, PluginInitializer } from 'homebridge';

const init: PluginInitializer = (api: API): void => {
    // eslint-disable-next-line no-console
    console.debug(`Plugin loaded with Homebridge v${api.serverVersion}.`);
};

export default init;
