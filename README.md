# homebridge-alexa-player
A Homebridge plugin that enables basic smart speaker HomeKit integration for Alexa devices (Echo, etc.).

## Pre-Release Warnings

This plug-in is in the *very* early stages of development. Please be aware of the following caveats:

* It is highly likely that the configuration schema will undergo breaking changes before a 1.0 release.
* The authentication configuration/process is less than optimal and will be improved before a 1.0 release.
* In the Home app, you can only operate play/pause with the accessory controls. Volume can only be controlled via scenes or automations in the Home app. This is due to shortcomings of the Home app, not the plug-in. Alternatives, such as using a brightness control for volume, may be added in the future.
* Nothing seems to work in the Home+ app. This is still being investigated.
* The only devices currently supported are Echo family speakers. This may or may not change.

## Configuration

### Options

#### Required

All of the following configuration options are required. If any are missing or invalid, Homebridge will log an error message describing the problem.

* **`"platform"`:** Must be `"AlexaPlayer"`.

* **`"amazonDomain"`:** The Amazon domain that your devices are registered to (e.g., `"amazon.com"`, `"amazon.co.uk"`).

* **`"auth"`:**

  * **`"proxy"`**:

    * **`"clientHost"`**: A current hostname or IP address of the Homebridge host that is accessible from the web browser where you will authenticate from.

    * **`"port"`**: The port to run the authentication proxy on.

#### Optional

The following configuration options are optional and change the default behavior.

* **`"auth"`:** Your Amazon login credentials.

  * **`"cookie"`:** A valid Amazon authentication cookie. If you do not provide this value, you will need to login using a URL that combines the Proxy Client Host and Proxy Port (e.g., http://192.168.1.234:5678/) every time Homebridge starts. The cookie is logged to the Homebridge debug logs after a successful login using the proxy.

* **`"screensAsTelevisions"`:** Represent Echo Show (KNIGHT) family devices as television accessories instead of as smart speaker accessories (the default).

### Example

Update the `"platforms"` section of your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "AlexaPlayer",
      "amazonDomain": "amazon.com",
      "auth": {
        "proxy": {
          "clientHost": "192.168.1.234",
          "port": 5678
        }
      },
      "screensAsTelevisions": true
    }
  ]
}
```
