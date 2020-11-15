import { Device } from 'alexa-remote2';
import type { Logging } from 'homebridge';

export interface DevicePredicate {
    test(device: Device): boolean;
}

export class DeviceFamilyPredicate implements DevicePredicate {
    private readonly allowedDeviceFamiles: Set<string>;

    public constructor(private readonly logger: Logging, ...allowedDeviceFamilies: string[]) {
        this.allowedDeviceFamiles = new Set(allowedDeviceFamilies);
    }

    public test(device: Device): boolean {
        if (this.allowedDeviceFamiles.has(device.deviceFamily)) {
            return true;
        }

        this.logger.debug(`Filtering device (${device.serialNumber}) for device family: ${device.deviceFamily}`);

        return false;
    }
}

export class DeviceCapabilitiesPredicate implements DevicePredicate {
    private readonly requiredCapabilities: Set<string>;

    public constructor(private readonly logger: Logging, ...requiredCapabilities: string[]) {
        this.requiredCapabilities = new Set(requiredCapabilities);
    }

    public test(device: Device): boolean {
        const missingDeviceCapabilties = new Set(this.requiredCapabilities);

        device.capabilities.forEach(capability => missingDeviceCapabilties.delete(capability));

        if (0 === missingDeviceCapabilties.size) {
            return true;
        }

        this.logger.debug(`Filtering device (${device.serialNumber}) for missing device capabilities: ${[...missingDeviceCapabilties].join(', ')}`);

        return false;
    }
}
