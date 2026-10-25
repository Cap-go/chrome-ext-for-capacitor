// uiManager.ts

import { defaultDevice, deviceConfigFromState } from './deviceConfigs';
import { getTabState, setTabState, TabState } from './tabState';

export async function updateBadgeText(tabId: number) {
  const state = getTabState(tabId);
  await chrome.action.setBadgeText({
    text: state.isActive ? state.currentDevice.name.slice(0, 4) : '',
    tabId,
  });
}

export async function syncState(tabId: number) {
  const state = getTabState(tabId);
  await chrome.storage.local.set({ [tabId.toString()]: state });
  await updateBadgeText(tabId);
  await notifyStateChange(tabId, state);
}

export async function notifyStateChange(tabId: number, state: TabState) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'updateState',
      state: {
        isActive: state.isActive,
        currentDeviceName: state.currentDevice.name,
      },
    });
  } catch (error) {
    console.error('Error notifying content script:', error);
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'updateState',
      tabId,
      state: {
        isActive: state.isActive,
        currentDevice: state.currentDevice,
        browserId: state.browserId,
      },
    });
  } catch (error) {
    console.error('Error notifying DevTools panel:', error);
  }
}

export async function updateState(tabId: number, updates: Partial<TabState>) {
  const currentState = getTabState(tabId);
  const newState = { ...currentState, ...updates };
  setTabState(tabId, newState);
  await syncState(tabId);
  return newState;
}

export async function initializeState(tabId: number) {
  const state = await chrome.storage.local.get(tabId.toString());
  const stored = state[tabId] as TabState | undefined;
  if (stored) {
    setTabState(tabId, {
      ...stored,
      currentDevice: deviceConfigFromState(stored.currentDevice),
    });
  } else {
    setTabState(tabId, {
      isActive: false,
      currentDevice: defaultDevice(),
      browserId: 'app',
    });
  }
  await syncState(tabId);
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    void syncState(tabId);
  }
});

// Clean up state when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(tabId.toString());
});
