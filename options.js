"use strict";

const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  xbutton1: "closeTab",
  xbutton2: "enter",
});

const ACTIONS = Object.freeze([
  ["closeTab", "Close current tab"],
  ["newTab", "New tab"],
  ["restoreTab", "Reopen closed tab"],
  ["back", "Back"],
  ["forward", "Forward"],
  ["reload", "Reload"],
  ["enter", "Enter"],
  ["none", "Do nothing"],
]);

const form = document.querySelector("#settings-form");
const enabledInput = document.querySelector("#enabled");
const xbutton1Select = document.querySelector("#xbutton1");
const xbutton2Select = document.querySelector("#xbutton2");
const restoreButton = document.querySelector("#restore-defaults");
const status = document.querySelector("#status");
let statusTimer;

populateActionSelect(xbutton1Select);
populateActionSelect(xbutton2Select);
loadSettings();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSettings({
    enabled: enabledInput.checked,
    xbutton1: xbutton1Select.value,
    xbutton2: xbutton2Select.value,
  }, "Settings saved.");
});

restoreButton.addEventListener("click", () => {
  applySettings(DEFAULT_SETTINGS);
  saveSettings(DEFAULT_SETTINGS, "Defaults restored.");
});

function populateActionSelect(select) {
  for (const [value, label] of ACTIONS) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  }
}

function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    if (chrome.runtime.lastError) {
      showStatus("Unable to load settings.", true);
      return;
    }

    applySettings(settings);
  });
}

function applySettings(settings) {
  const safeSettings = sanitizeSettings(settings);
  enabledInput.checked = safeSettings.enabled;
  xbutton1Select.value = safeSettings.xbutton1;
  xbutton2Select.value = safeSettings.xbutton2;
}

function saveSettings(settings, confirmation) {
  chrome.storage.local.set(settings, () => {
    if (chrome.runtime.lastError) {
      showStatus("Unable to save settings.", true);
      return;
    }

    showStatus(confirmation, false);
  });
}

function showStatus(message, isError) {
  clearTimeout(statusTimer);
  status.textContent = message;
  status.classList.toggle("error", isError);
  statusTimer = setTimeout(() => {
    status.textContent = "";
    status.classList.remove("error");
  }, 3000);
}

function sanitizeSettings(settings) {
  const supportedActions = new Set(ACTIONS.map(([value]) => value));

  return {
    enabled:
      typeof settings.enabled === "boolean"
        ? settings.enabled
        : DEFAULT_SETTINGS.enabled,
    xbutton1: supportedActions.has(settings.xbutton1)
      ? settings.xbutton1
      : DEFAULT_SETTINGS.xbutton1,
    xbutton2: supportedActions.has(settings.xbutton2)
      ? settings.xbutton2
      : DEFAULT_SETTINGS.xbutton2,
  };
}
