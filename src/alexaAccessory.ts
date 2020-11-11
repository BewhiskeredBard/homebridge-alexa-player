import type { Device, Media } from 'alexa-remote2';
import type { PlatformAccessory } from 'homebridge';

export interface AlexaAccessoryContext {
    device: Device;
    media: Media;
}

export interface AlexaAccessory extends PlatformAccessory {
    context: AlexaAccessoryContext;
}
