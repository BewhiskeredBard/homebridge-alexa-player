import * as fs from 'fs';
import * as tjs from 'typescript-json-schema';
import { PLATFORM_NAME } from '../src/alexaPlatformConfig';

const program = tjs.programFromConfig('tsconfig.json');
const generator = tjs.buildGenerator(program, {
    uniqueNames: true,
    noExtraProps: true,
    required: true,
    strictNullChecks: true,
});

if (!generator) {
    throw new Error('Failed to build schema generator.');
}

const configSymbolName = 'AlexaPlatformConfig';
const configSymbol = generator.getSymbols(configSymbolName).find(symbol => 0 < symbol.fullyQualifiedName.indexOf('src/alexaPlatformConfig'));

if (!configSymbol) {
    throw new Error(`Failed to find ${configSymbolName} symbol.`);
}

const schema = {
    pluginAlias: PLATFORM_NAME,
    pluginType: 'platform',
    singular: true,
    schema: generator.getSchemaForSymbol(configSymbol.name),
    layout: [
        {
            type: 'fieldset',
            expandable: false,
            title: 'Authentication',
            items: [
                {
                    key: 'auth.proxy.clientHost',
                    title: 'Proxy Client Host',
                    placeholder: 'e.g., homebridge.local, 192.168.1.123, localhost',
                    description:
                        'A current hostname or IP address of the homebridge host that is accessible from the web browser where you will authenticate from.',
                },
                {
                    key: 'auth.proxy.port',
                    title: 'Proxy Port',
                    placeholder: 'e.g., 2345',
                    description: 'The port to run the authentication proxy on.',
                },
                {
                    key: 'auth.cookie',
                    title: 'Cookie',
                    description:
                        'A valid Amazon authentication cookie. If you do not provide this value, you will need to login using a URL that combines the Proxy Client Host and Proxy Port (e.g., http://homebridge.local:2345/) every time homebridge starts. The cookie is logged to the homebridge debug logs after a successful login using the proxy.',
                },
            ],
        },
    ],
};

fs.writeFileSync('config.schema.json', JSON.stringify(schema));
