import { browserById } from './browserChrome';
import { defaultDevice, deviceConfigFromState, resolveDevice } from './deviceConfigs';
import { applyInsets, applySimulation, removeSimulation } from './simulationManager';
import { getTabState, hydrateTabState, setTabState, TabState } from './tabState';
import { syncState } from './uiManager';

interface ExtensionMessage {
  action?: string;
  deviceId?: string;
  postureId?: string;
  browserId?: string;
  isActive?: boolean;
  tabId?: number;
}

async function handleMessage(tabId: number, message: ExtensionMessage): Promise<{ success: true; state: TabState }> {
  const state = await hydrateTabState(tabId);

  switch (message.action) {
    case 'getState':
      return { success: true, state };
    case 'changeDevice': {
      const newDevice = resolveDevice(message.deviceId ?? '', message.postureId);
      if (!newDevice) throw new Error('Unknown device');
      const browserId = browserById(message.browserId ?? state.browserId).id;
      await applySimulation(tabId, newDevice, browserId);
      setTabState(tabId, { currentDevice: newDevice, isActive: true, browserId });
      break;
    }
    case 'changeBrowser': {
      const browserId = browserById(message.browserId).id;
      setTabState(tabId, { browserId });
      await applySimulation(tabId, getTabState(tabId).currentDevice, browserId);
      setTabState(tabId, { isActive: true });
      break;
    }
    case 'toggleSimulation':
      if (message.isActive) {
        const browserId = browserById(state.browserId).id;
        await applySimulation(tabId, state.currentDevice, browserId);
        setTabState(tabId, { isActive: true, browserId });
      } else {
        await removeSimulation(tabId);
        setTabState(tabId, { isActive: false });
      }
      break;
    case 'deviceFrameLoaded':
      if (state.isActive) await applyInsets(tabId, state.currentDevice, state.browserId);
      break;
    default:
      throw new Error('Unknown action');
  }

  await syncState(tabId);
  return { success: true, state: getTabState(tabId) };
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    sendResponse({ error: 'Invalid message' });
    return false;
  }

  const tabId = sender.tab?.id ?? message.tabId;
  if (!tabId) {
    sendResponse({ error: 'Unknown tab' });
    return false;
  }

  (async () => {
    try {
      sendResponse(await handleMessage(tabId, message));
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error handling message:', error);
      sendResponse({ error: messageText });
    }
  })();

  return true;
});

chrome.tabs.onCreated.addListener((tab) => {
  if (!tab.id) return;
  setTabState(tab.id, {
    isActive: false,
    currentDevice: defaultDevice(),
    browserId: 'app',
  });
  void syncState(tab.id);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    const state = getTabState(tabId);
    if (state.isActive) {
      void applySimulation(tabId, state.currentDevice, state.browserId);
    }
  }
});

chrome.runtime.onStartup.addListener(() => {
  void (async () => {
    const tabs = await chrome.tabs.query({});
    await Promise.all(tabs.map(async (tab) => {
      if (!tab.id) return;
      const result = await chrome.storage.local.get(tab.id.toString());
      const stored = result[tab.id] as TabState | undefined;
      if (!stored) return;
      setTabState(tab.id, {
        ...stored,
        currentDevice: deviceConfigFromState(stored.currentDevice),
      });
      await syncState(tab.id);
    }));
  })();
});

async function cleanupSimulation(tabId: number) {
  const state = getTabState(tabId);
  if (!state.isActive) return;
  await removeSimulation(tabId);
  setTabState(tabId, { isActive: false });
  await syncState(tabId);
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'devtools-page') return;

  let tabId: number | undefined;
  port.onMessage.addListener((message: ExtensionMessage) => {
    if (message.tabId) tabId = message.tabId;
  });
  port.onDisconnect.addListener(() => {
    if (tabId !== undefined) void cleanupSimulation(tabId);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void cleanupSimulation(tabId);
  void chrome.storage.local.remove(tabId.toString());
});


