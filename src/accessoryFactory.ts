import { default as AlexaRemote, Device, Media } from 'alexa-remote2';
import type { API, PlatformAccessory } from 'homebridge';
import { DevicePredicate } from './devicePredicate';
import { ServiceInitializer } from './serviceInitializer';

export class AccessoryFactory {
    public constructor(
        private readonly homebridge: API,
        private readonly alexa: AlexaRemote,
        private readonly devicePredicates: DevicePredicate[],
        private readonly serviceInitializers: ServiceInitializer[],
    ) {}

    public async createAccessories(): Promise<PlatformAccessory[]> {
        const devices = await this.getDevices();
        const accessories: Array<Promise<PlatformAccessory>> = [];

        devices
            .filter(device => this.devicePredicates.every(predicate => predicate.test(device)))
            .forEach(device => {
                accessories.push(this.createAccessory(device));
            });

        return await Promise.all(accessories);
    }

    private async createAccessory(device: Device): Promise<PlatformAccessory> {
        const media = await this.getMedia(device);
        const accessory = this.newAccessory(device);

        this.serviceInitializers.forEach(serviceInitializer => {
            serviceInitializer.initialize(accessory, device, media);
        });

        return accessory;
    }

    private getDevices(): Promise<Device[]> {
        return new Promise((resolve, reject) => {
            this.alexa.getDevices((error, data) => {
                if (error) {
                    return reject(error);
                }

                resolve(data.devices);
            });
        });
    }

    private getMedia(device: Device): Promise<Media> {
        return new Promise((resolve, reject) => {
            this.alexa.getMedia(device.serialNumber, (error, data) => {
                if (error) {
                    return reject(error);
                }

                resolve(data);
            });
        });
    }

    private newAccessory(device: Device): PlatformAccessory {
        const name = device.accountName;
        const serialNumber = device.serialNumber;
        const uuid = this.homebridge.hap.uuid.generate(serialNumber);
        const category = this.homebridge.hap.Categories.SPEAKER;

        return new this.homebridge.platformAccessory(name, uuid, category);
    }
}
