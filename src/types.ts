declare module 'alexa-remote2' {
    import type { EventEmitter } from 'events';

    type Callback<T> = (error: unknown, data: T) => void;

    type Command = {
        command: string;
        value?: unknown;
        device?: unknown;
    };

    type MediaState = 'PLAYING' | 'PAUSED' | 'IDLE' | string;

    export type Media = {
        currentState: MediaState;
        muted: boolean;
        volume: number;
    };

    type NotificationSound = {
        displayName: string;
        folder: string;
        id: string;
        providerId: string;
        sampleUrl: string;
    };

    type NotificationStatus = 'OFF' | 'ON';

    type NotificationType = 'Alarm' | 'Timer' | 'Reminder';

    type Notification = {
        alarmTime: number;
        createdDate: number;
        type: NotificationType;
        deviceSerialNumber: string;
        deviceType: string;
        reminderLabel?: string;
        sound?: NotificationSound;
        originalDate: string;
        originalTime: string;
        id: string;
        isRecurring: boolean;
        recurringPattern?: string;
        timeZoneId?: string;
        reminderIndex?: unknown;
        isSaveInFlight: boolean;
        status: NotificationStatus;
    } & Record<string, unknown>;

    export type Device = {
        accountName: string;
        // TODO
        bluetoothState: unknown;
        capabilities: string[];
        deviceFamily: string;
        deviceType: string;
        deviceTypeFriendlyName?: string;
        deviceOwnerCustomerId: string;
        isMultiroomDevice: boolean;
        isMultiroomMember: boolean;
        notifications: Notification[];
        softwareVersion: string | null;
        serialNumber: string;
        wakeWord?: string;

        // TODO: Add instance methods. Use OmitThisParameter<Type> or similar technique with AlexaRemote methods.
    } & Record<string, unknown>;

    type SerialOrName = string | Device;

    class AlexaRemote extends EventEmitter {
        public readonly cookie?: string;
        public constructor();
        public init(
            cookie:
                | {
                      cookie?: string;
                      email?: string;
                      password?: string;
                      proxyOnly?: boolean;
                      proxyOwnIp?: string;
                      proxyPort?: number;
                      proxyLogLevel?: string;
                      bluetooth?: boolean;
                      logger?: (message: string) => unknown;
                      alexaServiceHost?: string;
                      userAgent?: string;
                      acceptLanguage?: string;
                      amazonPage?: string;
                      amazonPageProxyLanguage?: string;
                      useWsMqtt?: boolean;
                      cookieRefreshInterval?: number;
                  }
                | string,
            callback: Callback<unknown>,
        ): void;

        public checkAuthentication(callback: Callback<unknown>): void;

        public getDevices(callback?: Callback<{ devices: Device[] }>): void;

        public getCards(callback?: Callback<unknown>): void;
        public getCards(limit: number, callback?: Callback<unknown>): void;
        public getCards(limit: number, beforeCreationTime: string, callback?: Callback<unknown>): void;

        public getMedia(serialOrName: SerialOrName, callback?: Callback<Media>): void;

        public getPlayerInfo(serialOrName: SerialOrName, callback?: Callback<unknown>): void;

        public getLists(callback?: Callback<unknown>): void;

        public getList(listId: string, callback?: Callback<unknown>): void;

        public getListItems(listId: string, callback?: Callback<unknown>): void;
        public getListItems(listId: string, options: Record<string, string>, callback?: Callback<unknown>): void;

        public addListItem(listId: string, options: string | Record<string, string>, callback?: Callback<unknown>): void;

        public updateListItem(
            listId: string,
            listItem: string,
            options: Record<string, unknown> & { version: string; value: string },
            callback?: Callback<unknown>,
        ): void;

        public deleteListItem(listId: string, listItem: string, callback?: Callback<unknown>): void;

        public getWakeWords(callback?: Callback<unknown>): void;

        public getReminders(callback?: Callback<unknown>): void;
        public getReminders(cached: boolean, callback?: Callback<unknown>): void;

        public getNotifications(callback?: Callback<unknown>): void;
        public getNotifications(cached: boolean, callback?: Callback<unknown>): void;

        // TODO: argument are optionally weird
        public createNotificationObject(serialOrName: SerialOrName, type: NotificationType, label: string, value: number, sound: NotificationSound): void;
        public createNotificationObject(
            serialOrName: SerialOrName,
            type: NotificationType,
            label: string,
            value: number,
            status: NotificationStatus,
            sound: NotificationSound,
        ): void;

        public createNotification(notification: Notification, callback?: Callback<unknown>): void;

        public changeNotification(notification: Notification, value: unknown, callback: Callback<unknown>): void;

        public deleteNotification(notification: Notification, callback: Callback<unknown>): void;

        public getDoNotDisturb(callback: Callback<unknown>): void;

        public getDeviceStatusList(callback: Callback<unknown>): void;

        public getDeviceNotificationState(serialOrName: SerialOrName, callback: Callback<unknown>): void;

        public getBluetooth(callback: Callback<unknown>): void;
        public getBluetooth(cached: boolean, callback: Callback<unknown>): void;

        public tuneinSearchRaw(query: string, callback: Callback<unknown>): void;

        public tuneinSearch(query: string, callback: Callback<unknown>): void;

        public setTunein(serialOrName: SerialOrName, guideId: string, callback: Callback<unknown>): void;
        public setTunein(serialOrName: SerialOrName, guideId: string, contentType: string, callback: Callback<unknown>): void;

        public getHistory(callback: Callback<unknown>): void;
        public getHistory(
            options:
                | {
                      startTime?: string;
                      size?: number;
                      offset?: number;
                  }
                | undefined,
            callback: Callback<unknown>,
        ): void;

        public getActivities(callback: Callback<unknown>): void;
        public getActivities(
            options:
                | {
                      startTime?: string;
                      size?: number;
                      offset?: number;
                  }
                | undefined,
            callback: Callback<unknown>,
        ): void;

        public getAccount(callback: Callback<unknown>): void;

        public getContacts(
            options:
                | {
                      includePreferencesByLevel?: string;
                      includeNonAlexaContacts?: boolean;
                      includeHomeGroupMembers?: boolean;
                      bulkImportOnly?: boolean;
                      includeBlockStatus?: boolean;
                      dedupeMode?: string;
                      homeGroupId?: string;
                  }
                | undefined,
            callback: Callback<unknown>,
        ): void;

        public getConversations(callback: Callback<unknown>): void;
        public getConversations(
            options:
                | {
                      latest?: boolean;
                      includeHomegroup?: boolean;
                      unread?: false;
                      modifiedSinceDate?: string;
                      includeUserName?: boolean;
                  }
                | undefined,
            callback: Callback<unknown>,
        ): void;

        public connectBluetooth(serialOrName: SerialOrName, btAddress: string, callback: Callback<unknown>): void;

        public disconnectBluetooth(serialOrName: SerialOrName, btAddress: string, callback: Callback<unknown>): void;

        public setDoNotDisturb(serialOrName: SerialOrName, enabled: boolean, callback: Callback<unknown>): void;

        public find(serialOrName: SerialOrName, callback: Callback<unknown>): Record<string, unknown> | null | undefined;

        public setAlarmVolume(serialOrName: SerialOrName, volume: number, callback: Callback<unknown>): void;

        public sendCommand(serialOrName: SerialOrName, command: string, value: unknown, callback: Callback<unknown>): void;

        public sendMessage(serialOrName: SerialOrName, command: string, value: unknown, callback: Callback<unknown>): void;

        public createSequenceNode(command: string, value: unknown, callback: Callback<unknown>): void;
        public createSequenceNode(command: string, value: unknown, serialOrName: SerialOrName, callback: Callback<unknown>): void;

        public sendMultiSequenceCommand(serialOrName: SerialOrName, commands: Command[], callback: Callback<unknown>): void;
        public sendMultiSequenceCommand(serialOrName: SerialOrName, commands: Command[], sequenceType: string, callback: Callback<unknown>): void;

        public sendSequenceCommand(serialOrName: SerialOrName, command: string | Record<string, unknown>, callback: Callback<unknown>): void;
        public sendSequenceCommand(serialOrName: SerialOrName, command: string | Record<string, unknown>, value: unknown, callback: Callback<unknown>): void;

        public getAutomationRoutines(callback: Callback<unknown>): void;
        public getAutomationRoutines(limit: number, callback: Callback<unknown>): void;

        public executeAutomationRoutine(serialOrName: SerialOrName, routine: string, callback: Callback<unknown>): void;

        public getMusicProviders(callback: Callback<unknown>): void;

        public playMusicProvider(serialOrName: SerialOrName, providerId: string, searchPhrase: string, callback: Callback<unknown>): void;

        public sendTextMessage(conversationId: string, text: string, callback: Callback<unknown>): void;

        public deleteConversation(conversationId: string, callback: Callback<unknown>): void;

        public setReminder(serialOrName: SerialOrName, timestamp: unknown /* TODO: new Date(timestamp) */, callback: Callback<unknown>): void;
        public setReminder(serialOrName: SerialOrName, timestamp: unknown /* TODO: new Date(timestamp) */, label: string, callback: Callback<unknown>): void;

        public getHomeGroup(callback: Callback<unknown>): void;

        public getDevicePreferences(callback: Callback<unknown>): void;

        public getSmarthomeDevices(callback: Callback<unknown>): void;

        public getSmarthomeGroups(callback: Callback<unknown>): void;

        public getSmarthomeEntities(callback: Callback<unknown>): void;

        public getSmarthomeBehaviourActionDefinitions(callback: Callback<unknown>): void;

        public renameDevice(serialOrName: SerialOrName, newName: string, callback: Callback<unknown>): void; /* TODO RETURN */

        public deleteSmarthomeDevice(smarthomeDevice: string, callback: Callback<unknown>): void;

        public deleteSmarthomeGroup(smarthomeGroup: string, callback: Callback<unknown>): void;

        public deleteAllSmarthomeDevices(callback: Callback<unknown>): void;

        public discoverSmarthomeDevice(callback: Callback<unknown>): void;

        public querySmarthomeDevices(applicanceIds: string | string[], callback: Callback<unknown>): void;
        public querySmarthomeDevices(applicanceIds: string | string[], entityType: string, callback: Callback<unknown>): void;

        public executeSmarthomeDeviceAction(entityIds: string | string[], parameters: Record<string, unknown>, callback: Callback<unknown>): void;
        public executeSmarthomeDeviceAction(
            entityIds: string | string[],
            parameters: Record<string, unknown>,
            entityType: string,
            callback: Callback<unknown>,
        ): void;

        public unpaireBluetooth(serialOrName: SerialOrName, btAddress: string, callback: Callback<unknown>): void;

        public deleteDevice(serialOrName: SerialOrName, callback: Callback<unknown>): void;

        public on(event: 'command', listener: (command: { command: string; payload: unknown }) => void): this;
    }

    export default AlexaRemote;
}
