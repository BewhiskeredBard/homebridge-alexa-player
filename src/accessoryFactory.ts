import { default as AlexaRemote, Device, Media } from 'alexa-remote2';
import type { API, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { CharacteristicInitializer } from './characteristicInitializer';
import { DevicePredicate } from './devicePredicate';
import { ServiceInitializer } from './serviceInitializer';

export class AccessoryFactory {
    private static readonly TV_DEVICE_FAMILES = new Set(['KNIGHT']);

    public constructor(
        private readonly homebridge: API,
        private readonly alexa: AlexaRemote,
        private readonly devicePredicates: DevicePredicate[],
        private readonly serviceInitializers: ServiceInitializer[],
        private readonly characteristicInitializers: CharacteristicInitializer[],
    ) {}

    public async createAccessories(): Promise<PlatformAccessory[]> {
        return await Promise.all(
            (await this.getDevices())
                .filter(device => this.devicePredicates.every(predicate => predicate.test(device)))
                .map(device => this.createAccessory(device)),
        );
    }

    private async createAccessory(device: Device): Promise<PlatformAccessory> {
        const media = await this.getMedia(device);
        const accessory = this.newAccessory(device);

        this.serviceInitializers.forEach(serviceInitializer => {
            const serviceType = serviceInitializer.getServiceType(this.homebridge.hap, device);

            if (serviceType) {
                const service = this.getService(accessory, serviceType);
                const characteristics = new Set(serviceInitializer.getCharacteristics(this.homebridge.hap, device).map(char => char.UUID));

                this.characteristicInitializers
                    .filter(characteristicInitializer => characteristics.has(characteristicInitializer.getCharacteristic().UUID))
                    .forEach(characteristicInitializer => characteristicInitializer.initialize(service, device, media));
            }
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
        const category = AccessoryFactory.TV_DEVICE_FAMILES.has(device.deviceFamily)
            ? this.homebridge.hap.Categories.TELEVISION
            : this.homebridge.hap.Categories.SPEAKER;

        return new this.homebridge.platformAccessory(name, uuid, category);
    }

    private getService(accessory: PlatformAccessory, serviceType: WithUUID<typeof Service>): Service {
        let service = accessory.getService(serviceType);

        if (!service) {
            service = accessory.addService(serviceType);
        }

        return service;
    }
}
