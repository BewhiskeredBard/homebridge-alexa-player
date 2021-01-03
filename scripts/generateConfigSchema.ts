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
                    key: 'auth.region',
                    title: 'Region',
                    placeholder: 'e.g., amazon.com, amazon.co.uk, amazon.es',
                    description: 'A valid Amazon region.',
                },
                {
                    key: 'auth.proxy.clientHost',
                    title: 'Proxy Client Host',
                    placeholder: 'e.g., 192.168.1.234, homebridge.local, localhost',
                    description:
                        'A current IP address or hostname of the Homebridge host that is accessible from the web browser where you will authenticate from.',
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
                        'A valid Amazon authentication cookie. If you do not provide this value, you will need to login using a URL that combines the Proxy Client Host and Proxy Port (e.g., http://192.168.1.234:5678/) every time Homebridge starts. The cookie is logged to the Homebridge debug logs after a successful login using the proxy.',
                },
            ],
        },
        {
            key: 'screensAsTelevisions',
            title: 'Screens as Televisions',
            description: 'Represent Echo Show (KNIGHT) family devices as television accessories instead of as smart speaker accessories (the default).',
        },
    ],
};

fs.writeFileSync('config.schema.json', JSON.stringify(schema));
