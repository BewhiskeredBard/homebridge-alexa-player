import { Device } from 'alexa-remote2';
import type { Characteristic, Service, HAP, WithUUID } from 'homebridge';

export interface ServiceInitializer {
    getServiceType(hap: HAP, device: Device): WithUUID<typeof Service> | undefined;
    getCharacteristics(hap: HAP, device: Device): WithUUID<new () => Characteristic>[];
}

export class SmartSpeakerServiceInitializer implements ServiceInitializer {
    public getServiceType(hap: HAP, device: Device): WithUUID<typeof Service> | undefined {
        return 'KNIGHT' !== device.deviceFamily ? hap.Service.SmartSpeaker : undefined;
    }

    public getCharacteristics(hap: HAP): WithUUID<new () => Characteristic>[] {
        return [hap.Characteristic.CurrentMediaState, hap.Characteristic.TargetMediaState, hap.Characteristic.Volume, hap.Characteristic.Mute];
    }
}

export class TelevisionServiceInitializer implements ServiceInitializer {
    public getServiceType(hap: HAP, device: Device): WithUUID<typeof Service> | undefined {
        return 'KNIGHT' === device.deviceFamily ? hap.Service.Television : undefined;
    }

    public getCharacteristics(hap: HAP): WithUUID<new () => Characteristic>[] {
        return [hap.Characteristic.CurrentMediaState, hap.Characteristic.TargetMediaState];
    }
}

export class TelevisionSpeakerServiceInitializer implements ServiceInitializer {
    public getServiceType(hap: HAP, device: Device): WithUUID<typeof Service> | undefined {
        return 'KNIGHT' === device.deviceFamily ? hap.Service.TelevisionSpeaker : undefined;
    }

    public getCharacteristics(hap: HAP): WithUUID<new () => Characteristic>[] {
        return [hap.Characteristic.Mute, hap.Characteristic.Volume];
    }
}

export class AccessoryInfoServiceInitializer implements ServiceInitializer {
    public getServiceType(hap: HAP): WithUUID<typeof Service> {
        return hap.Service.AccessoryInformation;
    }

    public getCharacteristics(hap: HAP): WithUUID<new () => Characteristic>[] {
        return [
            // TODO: hap.Characteristic.Identify
            hap.Characteristic.Manufacturer,
            hap.Characteristic.Model,
            hap.Characteristic.Name,
            hap.Characteristic.Model,
            hap.Characteristic.SerialNumber,
            hap.Characteristic.FirmwareRevision,
        ];
    }
}
