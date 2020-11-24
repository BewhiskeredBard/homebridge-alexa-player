import { Device } from 'alexa-remote2';
import type { Characteristic, Service, HAP, WithUUID } from 'homebridge';
import { AlexaPlatformConfig } from './alexaPlatformConfig';

export interface ServiceInitializer {
    getServiceType(device: Device): WithUUID<typeof Service> | undefined;
    getCharacteristics(device: Device): WithUUID<new () => Characteristic>[];
}

export abstract class BaseServiceInitializer implements ServiceInitializer {
    public constructor(protected readonly hap: HAP, protected readonly config: AlexaPlatformConfig) {}

    protected isTelevision(device: Device): boolean {
        return this.config.screensAsTelevisions === true && 'KNIGHT' === device.deviceFamily;
    }

    public abstract getServiceType(device: Device): WithUUID<typeof Service> | undefined;
    public abstract getCharacteristics(device: Device): WithUUID<new () => Characteristic>[];
}

export class SmartSpeakerServiceInitializer extends BaseServiceInitializer {
    public getServiceType(device: Device): WithUUID<typeof Service> | undefined {
        return this.isTelevision(device) ? undefined : this.hap.Service.SmartSpeaker;
    }

    public getCharacteristics(): WithUUID<new () => Characteristic>[] {
        return [
            this.hap.Characteristic.CurrentMediaState,
            this.hap.Characteristic.TargetMediaState,
            this.hap.Characteristic.Volume,
            this.hap.Characteristic.Mute,
        ];
    }
}

export class TelevisionServiceInitializer extends BaseServiceInitializer {
    public getServiceType(device: Device): WithUUID<typeof Service> | undefined {
        return this.isTelevision(device) ? this.hap.Service.Television : undefined;
    }

    public getCharacteristics(): WithUUID<new () => Characteristic>[] {
        return [this.hap.Characteristic.CurrentMediaState, this.hap.Characteristic.TargetMediaState];
    }
}

export class TelevisionSpeakerServiceInitializer extends BaseServiceInitializer {
    public getServiceType(device: Device): WithUUID<typeof Service> | undefined {
        return this.isTelevision(device) ? this.hap.Service.TelevisionSpeaker : undefined;
    }

    public getCharacteristics(): WithUUID<new () => Characteristic>[] {
        return [this.hap.Characteristic.Mute, this.hap.Characteristic.Volume];
    }
}

export class AccessoryInfoServiceInitializer extends BaseServiceInitializer {
    public getServiceType(): WithUUID<typeof Service> {
        return this.hap.Service.AccessoryInformation;
    }

    public getCharacteristics(): WithUUID<new () => Characteristic>[] {
        return [
            // TODO: hap.Characteristic.Identify
            this.hap.Characteristic.Manufacturer,
            this.hap.Characteristic.Model,
            this.hap.Characteristic.Name,
            this.hap.Characteristic.Model,
            this.hap.Characteristic.SerialNumber,
            this.hap.Characteristic.FirmwareRevision,
        ];
    }
}
