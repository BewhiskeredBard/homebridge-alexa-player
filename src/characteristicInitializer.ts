import { CommandEvent, CommandValue, Device, DopplerCommandEvent, Media, PushVolumeChangeCommandEvent, PushAudioPlayerStateCommandEvent } from 'alexa-remote2';
import type { Characteristic, CharacteristicValue, HAP, Logging, Service, WithUUID } from 'homebridge';
import { AlexaBridge } from './alexaBridge';

function isVolumeChange(command: CommandEvent): command is PushVolumeChangeCommandEvent {
    return command.command === CommandValue.PUSH_VOLUME_COMMAND;
}

function isAudioPlayerState(command: CommandEvent): command is PushAudioPlayerStateCommandEvent {
    return command.command === CommandValue.PUSH_AUDIO_PLAYER_STATE;
}

export interface CharacteristicInitializer {
    getCharacteristic(): WithUUID<new () => Characteristic>;
    initialize(service: Service, device: Device, media: Media): void;
}

export abstract class BaseCharacteristicInitializer implements CharacteristicInitializer {
    public constructor(protected readonly logger: Logging, protected readonly hap: HAP, private readonly alexa: AlexaBridge) {}

    protected setValue(service: Service, value: CharacteristicValue | null): void {
        service.getCharacteristic(this.getCharacteristic()).setValue(value);
    }

    protected onSet(
        device: Device,
        service: Service,
        getCommand: ((value: CharacteristicValue) => string) | string,
        getCommandValue?: ((value: CharacteristicValue) => unknown) | string | number | Record<string, unknown> | undefined,
    ): void {
        this.alexa.onCharacteristicSet(device, service, this.getCharacteristic(), getCommand, getCommandValue);
    }

    protected onCommand(device: Device, listener: (command: DopplerCommandEvent) => void): void {
        this.alexa.onDeviceCommand(device, listener);
    }

    public abstract getCharacteristic(): WithUUID<new () => Characteristic>;
    public abstract initialize(service: Service, device: Device, media: Media): void;
}

export class CurrentMediaStateInitializer extends BaseCharacteristicInitializer {
    public getCharacteristic(): WithUUID<new () => Characteristic> {
        return this.hap.Characteristic.CurrentMediaState;
    }

    public initialize(service: Service, device: Device, media: Media): void {
        this.setValue(service, media.currentState);

        this.onCommand(device, command => {
            if (isAudioPlayerState(command)) {
                this.setValue(service, command.payload.audioPlayerState);
            }
        });
    }

    protected setValue(service: Service, state: string): void {
        const CurrentMediaState = this.hap.Characteristic.CurrentMediaState;
        let currentMediaState;

        switch (state) {
            case 'PLAYING':
                currentMediaState = CurrentMediaState.PLAY;
                break;
            case 'INTERRUPTED':
                currentMediaState = CurrentMediaState.PAUSE;
                break;
            case 'FINISHED':
            default:
                currentMediaState = CurrentMediaState.STOP;
                break;
        }

        super.setValue(service, currentMediaState);
    }
}

export class MuteInitializer extends BaseCharacteristicInitializer {
    public getCharacteristic(): WithUUID<new () => Characteristic> {
        return this.hap.Characteristic.Mute;
    }

    public initialize(service: Service, device: Device, media: Media): void {
        this.setValue(service, media.muted);

        this.onSet(device, service, 'volume', value => value);

        this.onCommand(device, command => {
            if (isVolumeChange(command) && null !== command.payload.isMuted) {
                this.setValue(service, command.payload.isMuted);
            }
        });
    }
}

export class TargetMediaStateInitializer extends BaseCharacteristicInitializer {
    public getCharacteristic(): WithUUID<new () => Characteristic> {
        return this.hap.Characteristic.TargetMediaState;
    }

    public initialize(service: Service, device: Device, media: Media): void {
        this.setValue(service, media.currentState);

        const TargetMediaState = this.hap.Characteristic.TargetMediaState;

        this.onSet(device, service, value => {
            switch (value) {
                case TargetMediaState.PAUSE:
                case TargetMediaState.STOP:
                    return 'pause';
                case TargetMediaState.PLAY:
                    return 'play';
            }
            throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
        });

        this.onCommand(device, command => {
            if (isAudioPlayerState(command)) {
                this.setValue(service, command.payload.audioPlayerState);
            }
        });
    }

    protected setValue(service: Service, state: string): void {
        const TargetMediaState = this.hap.Characteristic.TargetMediaState;
        let targetMediaState;

        switch (state) {
            case 'PLAYING':
                targetMediaState = TargetMediaState.PLAY;
                break;
            case 'INTERRUPTED':
                targetMediaState = TargetMediaState.PAUSE;
                break;
            case 'FINISHED':
            default:
                targetMediaState = TargetMediaState.STOP;
                break;
        }

        super.setValue(service, targetMediaState);
    }
}

export class VolumeInitializer extends BaseCharacteristicInitializer {
    public getCharacteristic(): WithUUID<new () => Characteristic> {
        return this.hap.Characteristic.Volume;
    }

    public initialize(service: Service, device: Device, media: Media): void {
        this.setValue(service, media.volume);

        this.onSet(device, service, 'volume', value => value);

        this.onCommand(device, command => {
            if (isVolumeChange(command) && null !== command.payload.volumeSetting) {
                this.setValue(service, command.payload.volumeSetting);
            }
        });
    }
}

export class ManufacturerInitializer extends BaseCharacteristicInitializer {
    public getCharacteristic(): WithUUID<new () => Characteristic> {
        return this.hap.Characteristic.Manufacturer;
    }

    public initialize(service: Service): void {
        this.setValue(service, 'Amazon.com');
    }
}

export class ModelInitializer extends BaseCharacteristicInitializer {
    public getCharacteristic(): WithUUID<new () => Characteristic> {
        return this.hap.Characteristic.Model;
    }

    public initialize(service: Service, device: Device): void {
        this.setValue(service, device.deviceType);
    }
}

export class FirmwareRevisionInitializer extends BaseCharacteristicInitializer {
    public getCharacteristic(): WithUUID<new () => Characteristic> {
        return this.hap.Characteristic.FirmwareRevision;
    }

    public initialize(service: Service, device: Device): void {
        this.setValue(service, device.softwareVersion);
    }
}

export class NameInitializer extends BaseCharacteristicInitializer {
    public getCharacteristic(): WithUUID<new () => Characteristic> {
        return this.hap.Characteristic.Name;
    }

    public initialize(service: Service, device: Device): void {
        this.setValue(service, device.accountName);
    }
}

export class SerialNumberInitializer extends BaseCharacteristicInitializer {
    public getCharacteristic(): WithUUID<new () => Characteristic> {
        return this.hap.Characteristic.SerialNumber;
    }

    public initialize(service: Service, device: Device): void {
        this.setValue(service, device.serialNumber);
    }
}
