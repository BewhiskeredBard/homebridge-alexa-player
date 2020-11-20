import { Device, Media, CommandEvent, PushVolumeChangeCommandEvent, PushAudioPlayerStateCommandEvent, CommandValue } from 'alexa-remote2';
import type { PlatformAccessory, Logging, Service, HAP, WithUUID } from 'homebridge';
import { AlexaBridge } from './alexaBridge';

export interface ServiceInitializer {
    initialize(accessory: PlatformAccessory, device: Device, media: Media): void;
}

export abstract class BaseServiceInitializer implements ServiceInitializer {
    public constructor(protected readonly logger: Logging, protected readonly hap: HAP, protected readonly alexaBridge: AlexaBridge) {}

    public initialize(accessory: PlatformAccessory, device: Device, media: Media): void {
        const serviceType = this.getServiceType();
        let service = accessory.getService(serviceType);

        if (!service) {
            service = accessory.addService(serviceType);
        }

        this.init(service, device, media);
    }

    protected abstract getServiceType(): WithUUID<typeof Service>;
    protected abstract init(service: Service, device: Device, media: Media): void;
}

export class SmartSpeakerServiceInitializer extends BaseServiceInitializer {
    protected getServiceType(): WithUUID<typeof Service> {
        return this.hap.Service.SmartSpeaker;
    }

    protected init(service: Service, device: Device, media: Media): void {
        this.setCurrentMediaState(service, media.currentState);
        this.setTargetMediaState(service, media.currentState);
        this.setVolume(service, media.volume);
        this.setMute(service, media.muted);

        const HapCharacteristic = this.hap.Characteristic;
        const TargetMediaState = HapCharacteristic.TargetMediaState;
        const Volume = HapCharacteristic.Volume;
        const Mute = HapCharacteristic.Mute;

        this.alexaBridge.onCharacteristicSet(device, service, TargetMediaState, value => {
            switch (value) {
                case TargetMediaState.PAUSE:
                case TargetMediaState.STOP:
                    return 'pause';
                case TargetMediaState.PLAY:
                    return 'play';
            }
            throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
        });

        this.alexaBridge.onCharacteristicSet(device, service, Volume, 'volume', value => value);

        this.alexaBridge.onCharacteristicSet(device, service, Mute, 'mute', value => {
            return { mute: value };
        });

        this.alexaBridge.onDeviceCommand(device, command => {
            if (this.isVolumeChange(command)) {
                if (null !== command.payload.volumeSetting) {
                    this.setVolume(service, command.payload.volumeSetting);
                }

                if (null !== command.payload.isMuted) {
                    this.setMute(service, command.payload.isMuted);
                }
            } else if (this.isAudioPlayerState(command)) {
                this.setCurrentMediaState(service, command.payload.audioPlayerState);
                this.setTargetMediaState(service, command.payload.audioPlayerState);
            }
        });
    }

    private setVolume(service: Service, volume: number) {
        service.getCharacteristic(this.hap.Characteristic.Volume).setValue(volume);
    }

    private setMute(service: Service, isMuted: boolean) {
        service.getCharacteristic(this.hap.Characteristic.Mute).setValue(isMuted);
    }

    private setCurrentMediaState(service: Service, state: string): void {
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

        service.getCharacteristic(CurrentMediaState).setValue(currentMediaState);
    }

    private setTargetMediaState(service: Service, state: string): void {
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

        service.getCharacteristic(TargetMediaState).setValue(targetMediaState);
    }

    private isVolumeChange(command: CommandEvent): command is PushVolumeChangeCommandEvent {
        return command.command === CommandValue.PUSH_VOLUME_COMMAND;
    }

    private isAudioPlayerState(command: CommandEvent): command is PushAudioPlayerStateCommandEvent {
        return command.command === CommandValue.PUSH_AUDIO_PLAYER_STATE;
    }
}

export class AccessoryInfoServiceInitializer extends BaseServiceInitializer {
    protected getServiceType(): WithUUID<typeof Service> {
        return this.hap.Service.AccessoryInformation;
    }

    protected init(service: Service, device: Device, media: Media): void {
        // TODO: const identify = service.getCharacteristic(this.Characteristic.Identify);
        const manufacturer = service.getCharacteristic(this.hap.Characteristic.Manufacturer);
        const model = service.getCharacteristic(this.hap.Characteristic.Model);
        const name = service.getCharacteristic(this.hap.Characteristic.Name);
        const serialNumber = service.getCharacteristic(this.hap.Characteristic.SerialNumber);
        const firmwareRevision = service.getCharacteristic(this.hap.Characteristic.FirmwareRevision);

        manufacturer.setValue('Amazon.com');
        model.setValue(device.deviceType);
        firmwareRevision.setValue(device.softwareVersion);
        name.setValue(device.accountName);
        serialNumber.setValue(device.serialNumber);

        // TODO: Handle device name changes and software updates.
    }
}
