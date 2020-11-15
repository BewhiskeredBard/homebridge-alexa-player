import {
    default as AlexaRemote,
    Device,
    Media,
    CommandEvent,
    DopplerCommandEvent,
    PushVolumeChangeCommandEvent,
    PushAudioPlayerStateCommandEvent,
    CommandValue,
} from 'alexa-remote2';
import type { PlatformAccessory, Logging, Characteristic, CharacteristicValue, CharacteristicSetCallback, Service, HAP, WithUUID } from 'homebridge';

export interface ServiceInitializer {
    initialize(accessory: PlatformAccessory, device: Device, media: Media): void;
}

export abstract class BaseServiceInitializer implements ServiceInitializer {
    private readonly accessories = new Map<string, PlatformAccessory>();

    public constructor(protected readonly logger: Logging, protected readonly hap: HAP, protected readonly alexaRemote: AlexaRemote) {}

    public initialize(accessory: PlatformAccessory, device: Device, media: Media): void {
        this.init(this.getService(accessory), device, media);
        this.accessories.set(device.serialNumber, accessory);
        this.alexaRemote.on('command', command => this.onCommand(command));
    }

    protected getService(accessory: PlatformAccessory): Service {
        const serviceType = this.getServiceType();
        let service = accessory.getService(serviceType);

        if (!service) {
            service = accessory.addService(serviceType);
        }

        return service;
    }

    protected onSet(
        service: Service,
        device: Device,
        characteristic: WithUUID<new () => Characteristic>,
        getCommand: ((value: CharacteristicValue) => string) | string,
        getCommandValue?: ((value: CharacteristicValue) => unknown) | string | number | Record<string, unknown> | undefined,
    ): void {
        service
            .getCharacteristic(characteristic)
            .on(this.hap.CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                try {
                    const command = 'function' === typeof getCommand ? getCommand(value) : getCommand;
                    const commandValue = 'function' === typeof getCommandValue ? getCommandValue(value) : getCommandValue;

                    this.alexaRemote.sendCommand(device.serialNumber, command, commandValue, e => {
                        if (e) {
                            const message = `Failed to send ${command} to set ${characteristic.name} to ${JSON.stringify(commandValue)}.`;
                            this.logger.error(message, e);
                            return callback(new Error(message));
                        }

                        return callback(undefined);
                    });
                } catch (e) {
                    this.logger.error(`Uncaught error on setting ${characteristic.name}: ${JSON.stringify(e)}`);
                    callback(e);
                }
            });
    }

    private onCommand(command: CommandEvent): void {
        if (this.isDopplerCommand(command)) {
            const accessory = this.accessories.get(command.payload.dopplerId.deviceSerialNumber);

            if (accessory) {
                this.onServiceCommand(this.getService(accessory), command);
            }
        }
    }

    private isDopplerCommand(command: CommandEvent): command is DopplerCommandEvent {
        return 'dopplerId' in command.payload;
    }

    protected abstract getServiceType(): WithUUID<typeof Service>;
    protected abstract init(service: Service, device: Device, media: Media): void;
    protected abstract onServiceCommand<T extends CommandEvent>(service: Service, command: T): void;
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

        this.onSet(service, device, TargetMediaState, value => {
            switch (value) {
                case TargetMediaState.PAUSE:
                case TargetMediaState.STOP:
                    return 'pause';
                case TargetMediaState.PLAY:
                    return 'play';
            }
            throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
        });

        this.onSet(service, device, Volume, 'volume', value => value);

        this.onSet(service, device, Mute, 'mute', value => {
            return { mute: value };
        });
    }

    protected onServiceCommand<T extends CommandEvent>(service: Service, command: T): void {
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
    }

    protected onServiceCommand<T extends CommandEvent>(service: Service, command: T): void {
        // TODO: Handle device name changes and software updates.
    }
}
