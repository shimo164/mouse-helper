# Mouse Side Button Remapper

A Chrome Manifest V3 extension for Windows 10 and 11 that remaps the common
Back and Forward mouse thumb buttons on regular web pages.

## Install for development

1. Open `chrome://extensions` in Google Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this project directory.
5. Open the extension's **Details**, then **Extension options**, to configure
   both buttons.

The defaults are:

- Back thumb button: Close current tab
- Forward thumb button: Enter
- Remapping: Enabled

## Available actions

- Close current tab
- New tab
- Reopen closed tab
- Back
- Forward
- Reload
- Enter
- Do nothing

Settings are stored locally with `chrome.storage.local` and take effect as soon
as they are saved. The extension makes no network requests and includes no
telemetry or analytics.

## Limitations

- Chrome sometimes handles mouse Back/Forward outside page JavaScript. The
  extension attempts to suppress `mousedown`, `mouseup`, and `auxclick`, but
  suppression cannot be guaranteed on every page or Chrome version.
- Content scripts cannot run on Chrome internal pages (`chrome://`), extension
  pages, the Chrome Web Store, or other restricted pages. Thumb buttons retain
  their normal behavior there.
- The Enter action dispatches synthetic DOM keyboard events and applies common
  element-specific fallbacks. It is not identical to a physical Enter key, and
  pages may ignore synthetic events.
- The extension performs browser and page actions only. It does not generate
  operating-system keyboard input and does not work outside Chrome.

## Manual verification

After loading the extension, use normal `http://` or `https://` pages to test:

1. Open multiple tabs and press the Back thumb button to close the active tab.
2. Focus a button and press the Forward thumb button to activate it.
3. Focus a text input in a form and test the Enter-like submission behavior.
4. Change each mapping in Options and verify that it applies without restarting
   Chrome.
5. Disable remapping and verify Chrome's normal Back/Forward behavior returns.
