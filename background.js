"use strict";

const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  xbutton1: "closeTab",
  xbutton2: "enter",
});

const BACKGROUND_ACTIONS = new Set(["closeTab", "newTab", "restoreTab"]);

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    if (chrome.runtime.lastError) {
      return;
    }

    chrome.storage.local.set(settings);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message?.type !== "executeAction" ||
    !BACKGROUND_ACTIONS.has(message.action)
  ) {
    return false;
  }

  executeAction(message.action, sender.tab?.id)
    .then(() => sendResponse({ ok: true }))
    .catch(() => sendResponse({ ok: false }));

  return true;
});

async function executeAction(action, sourceTabId) {
  switch (action) {
    case "closeTab":
      if (typeof sourceTabId === "number") {
        await chrome.tabs.remove(sourceTabId);
      }
      break;

    case "newTab":
      await chrome.tabs.create({ url: "chrome://newtab/", active: true });
      break;

    case "restoreTab":
      if (chrome.sessions?.restore) {
        await chrome.sessions.restore();
      }
      break;
  }
}
