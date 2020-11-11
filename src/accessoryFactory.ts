import { default as AlexaRemote, Device, Media } from 'alexa-remote2';
import type { API, Logging } from 'homebridge';
import { AlexaAccessory } from './alexaAccessory';

// Relevant capabilities:
// - VOLUME_SETTING (mShop, fire tablet, echo, Sonos)
// - SOUND_SETTINGS (fire tablet, echo)
// - AUDIO_CONTROLS (echo, Sonos Beam)
// - AUDIO_PLAYER (echo, Sonos)
// - DS_VOLUME_SETTING (echo)
const REQUIRED_CAPABILTIES = new Set(['VOLUME_SETTING', 'AUDIO_CONTROLS']);

// Device families:
// - ECHO (echo)
// - TABLET (fire tablet)
// - MSHOP (mobile shopping app)
// - THIRD_PARTY_AVS_MEDIA_DISPLAY (Sonos)
// - THIRD_PARTY_AVS_SONOS_BOOTLEG (Sonos)
const ALLOWED_DEVICE_FAMILIES = new Set(['ECHO']);

export class AccessoryFactory {
    public constructor(private readonly logger: Logging, private readonly homebridge: API, private readonly alexaRemote: AlexaRemote) {}

    public async createAccessories(): Promise<AlexaAccessory[]> {
        const devices = await this.getDevices();
        const accessories: Array<Promise<AlexaAccessory>> = [];

        devices.forEach(device => {
            if (!ALLOWED_DEVICE_FAMILIES.has(device.deviceFamily)) {
                this.logger.debug(`Ignoring device (${device.serialNumber}) for device family: ${device.deviceFamily}`);
                return;
            }

            const missingDeviceCapabilties = new Set(REQUIRED_CAPABILTIES);

            device.capabilities.forEach(capability => missingDeviceCapabilties.delete(capability));

            if (0 < missingDeviceCapabilties.size) {
                this.logger.debug(`Ignoring device (${device.serialNumber}) for missing device capabilities: ${[...missingDeviceCapabilties].join(', ')}`);
                return;
            }

            accessories.push(this.createAccessory(device));
        });

        return Promise.all(accessories);
    }

    private async createAccessory(device: Device): Promise<AlexaAccessory> {
        const media = await this.getMedia(device);
        const accessory = this.newAccessory(device, media);

        this.initAccessoryInfo(accessory);
        this.initSmartSpeaker(accessory);

        return accessory;
    }

    private getDevices(): Promise<Device[]> {
        return new Promise((resolve, reject) => {
            this.alexaRemote.getDevices((error, data) => {
                if (error) {
                    return reject(error);
                }

                resolve(data.devices);
            });
        });
    }

    private getMedia(device: Device): Promise<Media> {
        return new Promise((resolve, reject) => {
            this.alexaRemote.getMedia(device.serialNumber, (error, data) => {
                if (error) {
                    return reject(error);
                }

                resolve(data);
            });
        });
    }

    private newAccessory(device: Device, media: Media): AlexaAccessory {
        const name = device.accountName;
        const serialNumber = device.serialNumber;
        const uuid = this.homebridge.hap.uuid.generate(serialNumber);
        const category = this.homebridge.hap.Categories.SPEAKER;
        const accessory = new this.homebridge.platformAccessory(name, uuid, category) as AlexaAccessory;

        accessory.context = {
            device,
            media,
        };

        return accessory;
    }

    private initAccessoryInfo(accessory: AlexaAccessory): void {
        let service = accessory.getService(this.homebridge.hap.Service.AccessoryInformation);

        if (!service) {
            service = accessory.addService(this.homebridge.hap.Service.AccessoryInformation);
        }

        // TODO: const identify = service.getCharacteristic(this.homebridge.hap.Characteristic.Identify);
        const manufacturer = service.getCharacteristic(this.homebridge.hap.Characteristic.Manufacturer);
        const model = service.getCharacteristic(this.homebridge.hap.Characteristic.Model);
        const name = service.getCharacteristic(this.homebridge.hap.Characteristic.Name);
        const serialNumber = service.getCharacteristic(this.homebridge.hap.Characteristic.SerialNumber);
        const firmwareRevision = service.getCharacteristic(this.homebridge.hap.Characteristic.FirmwareRevision);

        manufacturer.setValue('Amazon.com');
        model.setValue(accessory.context.device.deviceType);
        firmwareRevision.setValue(accessory.context.device.softwareVersion);
        name.setValue(accessory.context.device.accountName);
        serialNumber.setValue(accessory.context.device.serialNumber);

        // TODO: Bind handlers
    }

    private initSmartSpeaker(accessory: AlexaAccessory): void {
        let service = accessory.getService(this.homebridge.hap.Service.SmartSpeaker);

        if (!service) {
            service = accessory.addService(this.homebridge.hap.Service.SmartSpeaker);
        }

        const currentMediaState = service.getCharacteristic(this.homebridge.hap.Characteristic.CurrentMediaState);
        const targetMediaState = service.getCharacteristic(this.homebridge.hap.Characteristic.TargetMediaState);
        const volume = service.addCharacteristic(this.homebridge.hap.Characteristic.Volume);
        const mute = service.addCharacteristic(this.homebridge.hap.Characteristic.Mute);

        // TODO: Get the start state from media context
        currentMediaState.setValue(this.homebridge.hap.Characteristic.CurrentMediaState.STOP);
        targetMediaState.setValue(this.homebridge.hap.Characteristic.TargetMediaState.STOP);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        volume.setValue(50);
        mute.setValue(false);

        // TODO: Bind handlers
    }
}
