# Chrome Mouse Side Button Remapper

## 1. Overview

Create a Chrome extension for Windows that detects the two common mouse thumb buttons and maps them to configurable Chrome/browser actions.

Target buttons:

- XBUTTON1 / Back thumb button
- XBUTTON2 / Forward thumb button

Default mappings:

| Mouse button | Default action |
|---|---|
| XBUTTON1 / Back | Close current tab |
| XBUTTON2 / Forward | Enter-like action |

The mappings must be configurable from the extension Options page.

This project must work as a **Chrome extension only**.

Do not require:

- administrator privileges
- Windows application installation
- native helper applications
- Native Messaging
- registry changes

---

## 2. Supported Environment

Target:

- Windows 10
- Windows 11
- Google Chrome
- Chrome Manifest V3

Do not implement macOS or Linux-specific behavior.

---

## 3. Important Technical Constraints

This extension cannot generate arbitrary OS-level keyboard input.

Therefore:

- Do not attempt to simulate real `Ctrl+W`, `Ctrl+Shift+T`, etc. at Windows level.
- Use Chrome Extension APIs when an equivalent browser action exists.
- For page-level actions such as Enter, use DOM events or the focused element where practical.

Mouse thumb buttons may be detectable through mouse events:

```javascript
event.button === 3 // XBUTTON1
event.button === 4 // XBUTTON2
```

The extension should attempt to prevent the normal Back / Forward behavior using:

```javascript
event.preventDefault()
event.stopPropagation()
event.stopImmediatePropagation()
```

Use capturing listeners where appropriate.

Because Chrome may handle some mouse-navigation behavior outside normal page JavaScript, complete suppression is not guaranteed in every situation.

Document this limitation clearly.

---

## 4. Default Behavior

### XBUTTON1

Default action:

```text
Close current tab
```

Implementation:

Use the Chrome extension API to close the active tab.

For example:

```javascript
chrome.tabs.remove(tabId)
```

Expected behavior:

- Current Chrome tab closes.
- Normal Back navigation should be prevented when technically possible.

---

### XBUTTON2

Default action:

```text
Enter
```

Implement an Enter-like action on the currently focused element.

Recommended behavior:

1. Get:

```javascript
document.activeElement
```

2. Dispatch keyboard events for Enter:

```text
keydown
keypress
keyup
```

with:

```text
key = "Enter"
code = "Enter"
```

3. Where appropriate, provide element-specific fallback behavior.

Examples:

- `<button>`: call `.click()`
- `<input type="submit">`: call `.click()`
- text input inside a form: attempt `requestSubmit()`
- links or controls activated by Enter: attempt equivalent activation

Do not claim that this is identical to a physical Enter key.

---

## 5. Supported Actions

The Options page must allow each thumb button to select one action.

Implement at least:

```text
Close current tab
New tab
Reopen closed tab
Back
Forward
Reload
Enter
Do nothing
```

### Close current tab

Use Chrome tabs API.

### New tab

Create:

```text
chrome://newtab/
```

or use the standard Chrome tabs API.

### Reopen closed tab

Use:

```javascript
chrome.sessions.restore()
```

if available and permitted.

### Back

Use:

```javascript
history.back()
```

or an appropriate Chrome API if required.

### Forward

Use:

```javascript
history.forward()
```

### Reload

Use:

```javascript
location.reload()
```

or Chrome tabs API.

### Enter

Use the Enter-like behavior described above.

### Do nothing

Suppress the normal button action when possible, but perform no replacement action.

---

## 6. Options Page

Provide a simple Chrome extension Options page.

Example:

```text
Mouse Side Button Remapper

Back thumb button
[ Close current tab ▼ ]

Forward thumb button
[ Enter ▼ ]

[x] Enable remapping

[ Save ]
[ Restore defaults ]
```

Use dropdowns rather than free-form shortcut entry.

This is intentional because arbitrary keyboard shortcuts cannot be generated reliably from a Chrome extension alone.

---

## 7. Configuration

Store settings using:

```javascript
chrome.storage.local
```

Default configuration:

```json
{
  "enabled": true,
  "xbutton1": "closeTab",
  "xbutton2": "enter"
}
```

Supported action identifiers:

```text
closeTab
newTab
restoreTab
back
forward
reload
enter
none
```

---

## 8. Extension Structure

Suggested structure:

```text
mouse-side-button-remapper/
├── manifest.json
├── background.js
├── content.js
├── options.html
├── options.js
├── options.css
├── icons/
├── README.md
└── spec.md
```

Use a Manifest V3 service worker for background processing.

---

## 9. Manifest V3

Use Manifest V3.

Expected permissions:

```json
[
  "storage",
  "tabs",
  "sessions"
]
```

Content scripts should run on normal web pages.

Use the minimum required permissions.

Avoid unnecessary permissions.

Do not request:

```text
history
downloads
clipboardRead
clipboardWrite
```

unless required later.

---

## 10. Content Script

The content script should listen for mouse events using capture mode.

Example concept:

```javascript
document.addEventListener(
  "mousedown",
  handleMouseDown,
  true
);
```

Detect:

```javascript
event.button === 3
event.button === 4
```

When remapping is enabled:

1. Detect the configured action.
2. Attempt to suppress the original Back/Forward behavior.
3. Execute the configured action.

Use:

```javascript
event.preventDefault();
event.stopPropagation();
event.stopImmediatePropagation();
```

where appropriate.

Also investigate whether listening to:

```text
mousedown
mouseup
auxclick
```

improves reliability.

Avoid executing the configured action more than once per physical button press.

---

## 11. Background Communication

Actions requiring Chrome APIs should be sent from `content.js` to the service worker.

Example:

```javascript
chrome.runtime.sendMessage({
  type: "executeAction",
  action: "closeTab"
});
```

The service worker handles actions such as:

```text
closeTab
newTab
restoreTab
```

Page-local actions can remain in `content.js`.

---

## 12. Enable / Disable

Options page must include:

```text
[x] Enable remapping
```

When disabled:

- Do not execute custom actions.
- Do not suppress XBUTTON behavior.
- Chrome should behave normally.

Default:

```text
enabled = true
```

---

## 13. Restore Defaults

Provide:

```text
Restore defaults
```

This must restore:

```text
XBUTTON1 = Close current tab
XBUTTON2 = Enter
Enabled = true
```

---

## 14. Configuration Updates

When settings are saved:

1. Store them in `chrome.storage.local`.
2. New settings should take effect immediately.
3. Chrome restart must not be required.

Content scripts may listen to:

```javascript
chrome.storage.onChanged
```

to update cached settings.

---

## 15. Enter-like Action

Implement Enter conservatively.

Suggested logic:

```text
activeElement = document.activeElement
```

Then:

### Button

If element is:

```text
button
```

call:

```javascript
element.click()
```

### Submit input

For:

```html
<input type="submit">
```

call `.click()`.

### Link

For an interactive link that normally activates with Enter:

```javascript
element.click()
```

### Input inside form

If appropriate, use:

```javascript
element.form?.requestSubmit()
```

### Other elements

Dispatch synthetic KeyboardEvents.

Do not attempt to bypass browser security restrictions.

---

## 16. Restricted Pages

The extension will not work normally on pages where Chrome does not permit content scripts, including examples such as:

```text
chrome://
chrome-extension://
Chrome Web Store
```

Document this limitation.

Thumb-button behavior on such pages may remain the default Chrome behavior.

---

## 17. Frames

Where practical, support normal iframes using:

```json
"all_frames": true
```

Ensure one physical button press does not trigger actions independently in multiple frames.

Prefer acting only in the frame where the mouse event actually occurred.

---

## 18. Error Handling

The extension must not fail if:

- there is no focused element
- the active tab cannot be closed
- session restore is unavailable
- a page blocks synthetic events
- the content script cannot run
- an unsupported page is active

Failures should be handled silently where reasonable.

Do not show repeated alerts or notifications.

---

## 19. Security and Privacy

The extension must:

- make no network requests
- collect no browsing history
- collect no page contents
- include no telemetry
- include no analytics
- transmit no user data

Configuration remains locally stored using:

```javascript
chrome.storage.local
```

---

## 20. UI Requirements

Keep the Options page minimal.

Use:

```text
HTML
CSS
Vanilla JavaScript
```

Do not introduce React, Vue, or another framework.

The page should show:

```text
Mouse Side Button Remapper

Enable remapping
[✓]

Back thumb button
[ Close current tab ▼ ]

Forward thumb button
[ Enter ▼ ]

[ Save ]
[ Restore defaults ]
```

Show a short message after saving:

```text
Settings saved.
```

---

## 21. Testing

### Test 1: Close tab

Open multiple normal web pages.

Configuration:

```text
XBUTTON1 = Close current tab
```

Press XBUTTON1.

Expected:

```text
Current tab closes.
```

Check whether Back navigation was successfully suppressed.

---

### Test 2: Enter on button

Configuration:

```text
XBUTTON2 = Enter
```

Focus an HTML button.

Press XBUTTON2.

Expected:

```text
Button activates.
```

---

### Test 3: Enter on form

Focus a text input inside a normal form.

Press XBUTTON2.

Expected:

```text
Form behaves similarly to pressing Enter where technically possible.
```

---

### Test 4: Reload

Set:

```text
XBUTTON1 = Reload
```

Expected:

```text
Current page reloads.
```

---

### Test 5: New tab

Set:

```text
XBUTTON1 = New tab
```

Expected:

```text
A new Chrome tab opens.
```

---

### Test 6: Reopen tab

Close a tab.

Set:

```text
XBUTTON1 = Reopen closed tab
```

Expected:

```text
Recently closed tab is restored.
```

---

### Test 7: Disabled

Disable remapping.

Expected:

```text
XBUTTON1/XBUTTON2 return to normal Chrome Back/Forward behavior.
```

---

## 22. Development Priority

Implement in this order:

1. Create minimal Manifest V3 extension.
2. Detect mouse buttons 3 and 4 on a normal webpage.
3. Log detected events for verification.
4. Test whether Back/Forward can be suppressed reliably.
5. Implement Close current tab.
6. Implement Enter-like action.
7. Implement remaining actions.
8. Implement options page.
9. Implement persistent settings.
10. Test on multiple common websites.
11. Document limitations.

Do not spend time on visual polish before mouse-button detection and suppression have been verified.

---

## 23. Acceptance Criteria

Implementation is complete when:

- The extension works without installing any Windows application.
- No administrator privileges are required.
- Manifest V3 is used.
- XBUTTON1 and XBUTTON2 can be detected on normal webpages.
- Default XBUTTON1 action is Close current tab.
- Default XBUTTON2 action is Enter.
- Both actions can be changed from the Options page.
- Settings survive Chrome restart.
- Remapping can be disabled.
- Supported actions work without OS-level key simulation.
- No network communication or telemetry exists.
- Known Chrome limitations are documented.
- The README clearly states that suppression of native Back/Forward behavior cannot be guaranteed on every Chrome page or environment.

---

## 24. README Requirements

README.md must explain:

1. Purpose of the extension
2. Windows-only target
3. Installation through Chrome's "Load unpacked"
4. No native application is required
5. Default mappings
6. How to change mappings
7. Supported actions
8. Unsupported Chrome internal pages
9. Limitation of synthetic Enter behavior
10. Limitation of XBUTTON Back/Forward suppression
11. How to test button detection
