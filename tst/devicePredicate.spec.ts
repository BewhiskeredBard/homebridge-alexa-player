import type { Device } from 'alexa-remote2';
import type { Logging } from 'homebridge';
import { DeviceCapabilitiesPredicate, DeviceFamilyPredicate } from '../src/devicePredicate';

describe(`${DeviceCapabilitiesPredicate.name}`, () => {
    let logger: Logging;

    beforeAll(() => {
        logger = {
            debug: jest.fn() as unknown,
        } as Logging;
    });

    describe('.test(…)', () => {
        test('missing required capabilities', () => {
            const predicate = new DeviceCapabilitiesPredicate(logger, 'foo');

            expect(
                predicate.test(({
                    capabilities: [],
                } as unknown) as Device),
            ).toStrictEqual(false);

            expect(
                predicate.test(({
                    capabilities: ['bar'],
                } as unknown) as Device),
            ).toStrictEqual(false);
        });

        test('has required capabilities', () => {
            const predicate = new DeviceCapabilitiesPredicate(logger, 'foo');

            expect(
                predicate.test(({
                    capabilities: ['foo'],
                } as unknown) as Device),
            ).toStrictEqual(true);

            expect(
                predicate.test(({
                    capabilities: ['foo', 'bar'],
                } as unknown) as Device),
            ).toStrictEqual(true);
        });
    });
});

describe(`${DeviceFamilyPredicate.name}`, () => {
    let logger: Logging;

    beforeAll(() => {
        logger = {
            debug: jest.fn() as unknown,
        } as Logging;
    });

    describe('.test(…)', () => {
        test('not allowed family', () => {
            const predicate = new DeviceFamilyPredicate(logger, 'foo');

            expect(
                predicate.test(({
                    deviceFamily: 'bar',
                } as unknown) as Device),
            ).toStrictEqual(false);
        });

        test('allowed family', () => {
            const predicate = new DeviceFamilyPredicate(logger, 'foo');

            expect(
                predicate.test(({
                    deviceFamily: 'foo',
                } as unknown) as Device),
            ).toStrictEqual(true);
        });
    });
});
