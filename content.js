'use strict';

const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  xbutton1: 'closeTab',
  xbutton2: 'enter',
});

const BUTTON_SETTING_KEYS = Object.freeze({
  3: 'xbutton2',
  4: 'xbutton1',
});

const BACKGROUND_ACTIONS = new Set(['closeTab', 'newTab', 'restoreTab']);
const PAGE_ACTIONS = new Set(['back', 'forward', 'reload', 'enter', 'none']);
const pressedButtons = new Set();
const lastMouseDownTimes = new Map();
let settings = { ...DEFAULT_SETTINGS };

chrome.storage.local.get(DEFAULT_SETTINGS, (storedSettings) => {
  if (!chrome.runtime.lastError) {
    settings = sanitizeSettings(storedSettings);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }

  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (changes[key]) {
      settings[key] = changes[key].newValue;
    }
  }

  settings = sanitizeSettings(settings);
  if (!settings.enabled) {
    pressedButtons.clear();
  }
});

window.addEventListener('mousedown', handleMouseDown, {
  capture: true,
  passive: false,
});
window.addEventListener('mouseup', handleMouseUp, {
  capture: true,
  passive: false,
});
window.addEventListener('auxclick', handleAuxClick, {
  capture: true,
  passive: false,
});
window.addEventListener('blur', () => pressedButtons.clear(), true);

function handleMouseDown(event) {
  if (!isMappedButton(event.button) || !settings.enabled) {
    return;
  }

  suppressEvent(event);

  if (pressedButtons.has(event.button)) {
    return;
  }

  pressedButtons.add(event.button);
  lastMouseDownTimes.set(event.button, performance.now());
  executeConfiguredAction(event.button);
}

function handleMouseUp(event) {
  if (!isMappedButton(event.button) || !settings.enabled) {
    return;
  }

  suppressEvent(event);
  pressedButtons.delete(event.button);
}

function handleAuxClick(event) {
  if (!isMappedButton(event.button) || !settings.enabled) {
    return;
  }

  suppressEvent(event);

  // Some pages or Chrome versions may expose only auxclick. Use it as a
  // fallback, while avoiding a second action after the normal mousedown path.
  const lastMouseDown = lastMouseDownTimes.get(event.button);
  if (lastMouseDown === undefined || performance.now() - lastMouseDown > 750) {
    executeConfiguredAction(event.button);
  }
}

function isMappedButton(button) {
  return Object.prototype.hasOwnProperty.call(BUTTON_SETTING_KEYS, button);
}

function suppressEvent(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function executeConfiguredAction(button) {
  const settingKey = BUTTON_SETTING_KEYS[button];
  const action = settings[settingKey];

  if (BACKGROUND_ACTIONS.has(action)) {
    chrome.runtime.sendMessage(
      { type: 'executeAction', action },
      () => void chrome.runtime.lastError,
    );
    return;
  }

  if (!PAGE_ACTIONS.has(action)) {
    return;
  }

  switch (action) {
    case 'back':
      history.back();
      break;
    case 'forward':
      history.forward();
      break;
    case 'reload':
      location.reload();
      break;
    case 'enter':
      performEnterLikeAction();
      break;
    case 'none':
      break;
  }
}

function performEnterLikeAction() {
  const element = document.activeElement;
  if (!element || element === document.body || element === document.documentElement) {
    dispatchEnterEvents(document.body ?? document.documentElement);
    return;
  }

  const shouldActivate =
    element instanceof HTMLButtonElement ||
    (element instanceof HTMLAnchorElement && element.hasAttribute('href')) ||
    (element instanceof HTMLInputElement &&
      ['button', 'submit', 'reset', 'image'].includes(element.type)) ||
    element.getAttribute('role') === 'button' ||
    element.getAttribute('role') === 'link';

  const keyDownAccepted = dispatchKeyboardEvent(element, 'keydown');
  const keyPressAccepted = dispatchKeyboardEvent(element, 'keypress');

  if (keyDownAccepted && keyPressAccepted) {
    if (shouldActivate && typeof element.click === 'function') {
      element.click();
    } else if (isSubmittableTextInput(element) && element.form?.requestSubmit) {
      element.form.requestSubmit();
    }
  }

  dispatchKeyboardEvent(element, 'keyup');
}

function dispatchEnterEvents(element) {
  if (!element) {
    return;
  }

  dispatchKeyboardEvent(element, 'keydown');
  dispatchKeyboardEvent(element, 'keypress');
  dispatchKeyboardEvent(element, 'keyup');
}

function dispatchKeyboardEvent(element, type) {
  return element.dispatchEvent(
    new KeyboardEvent(type, {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      charCode: type === 'keypress' ? 13 : 0,
      which: 13,
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
    }),
  );
}

function isSubmittableTextInput(element) {
  return (
    element instanceof HTMLInputElement &&
    ['text', 'search', 'email', 'url', 'tel', 'password', 'number'].includes(element.type)
  );
}

function sanitizeSettings(candidate) {
  const supportedActions = new Set([...BACKGROUND_ACTIONS, ...PAGE_ACTIONS]);

  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : DEFAULT_SETTINGS.enabled,
    xbutton1: supportedActions.has(candidate.xbutton1)
      ? candidate.xbutton1
      : DEFAULT_SETTINGS.xbutton1,
    xbutton2: supportedActions.has(candidate.xbutton2)
      ? candidate.xbutton2
      : DEFAULT_SETTINGS.xbutton2,
  };
}
