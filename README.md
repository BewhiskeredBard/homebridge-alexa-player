# homebridge-alexa-player
A Homebridge plugin that enables basic smart speaker  HomeKit integration for Alexa devices (Echo, etc.).

## Pre-Release Warnings

This plug-in is in the *very* early stages of development. Please be aware of the following caveats:

* The authentication configuration/process is less than optimal and will be improved before a 1.0 release.
* There is no config UI support yet.
* In the Home app, you can only operate play/pause with the accessory controls. Volume can only be controlled via scenes or automations in the Home app. This is due to shortcomings of the Home app, not the plug-in. Alternatives, such as using a brightness control for volume, may be added in the future.
* Nothing seems to work in the Home+ app. This is still being investigated.
* The only devices currently supported are Echo family speakers. This may or may not change.

## Configuration

### Options

#### Required

All of the following configuration options are required. If any are missing or invalid, Homebridge will log an error message describing the problem.

* **`"platform"`:** Must be `"AlexaPlayer"`.

#### Optional

The following configuration options are optional and change the default behavior.

* **`"auth"`:** Your Amazon login credentials.

  * **`"cookie"`:** A valid Amazon login cookie. If you do not provide this value, you will need to login using a URL that will be dumped in the homebridge logs (similar to http://localhost:12345, but the port number is random). If you enable homebridge debug logging (`homebridge -D`), the cookie value will be dumped to the homebridge logs after a successful login attempt. Saving this cookie value here will prevent you from needing to login on every homebridge start.

### Example

Update the `"platforms"` section of your homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "AlexaPlayer",
      "auth": {}
    }
  ]
}
```
