import { browserById } from './browserChrome';
import { DeviceConfig, defaultDevice, deviceConfigFromState } from './deviceConfigs';

export interface TabState {
  isActive: boolean;
  currentDevice: DeviceConfig;
  browserId: string;
  checkIntervalId?: number;
}

const tabStates: { [tabId: number]: TabState } = {};
const hydratedTabs = new Set<number>();

/** Read the saved preset once per service-worker lifetime. Later edits stay in memory and storage. */
export async function hydrateTabState(tabId: number): Promise<TabState> {
  if (!hydratedTabs.has(tabId) && !tabStates[tabId]) {
    const stored = await chrome.storage.local.get(String(tabId));
    const saved = stored[String(tabId)] as TabState | undefined;
    if (saved?.currentDevice) {
      tabStates[tabId] = {
        isActive: !!saved.isActive,
        currentDevice: deviceConfigFromState(saved.currentDevice),
        browserId: browserById(saved.browserId).id,
      };
    }
  }
  hydratedTabs.add(tabId);
  return getTabState(tabId);
}

export function getTabState(tabId: number): TabState {
  const existing = tabStates[tabId];
  if (!existing) {
    tabStates[tabId] = {
      isActive: false,
      currentDevice: defaultDevice(),
      browserId: 'app',
    };
  } else {
    existing.currentDevice = deviceConfigFromState(existing.currentDevice);
    existing.browserId = browserById(existing.browserId).id;
  }
  return tabStates[tabId];
}

export function setTabState(tabId: number, state: Partial<TabState>) {
  const currentState = getTabState(tabId);
  tabStates[tabId] = {
    ...currentState,
    ...state,
    currentDevice: state.currentDevice
      ? deviceConfigFromState(state.currentDevice)
      : currentState.currentDevice,
    browserId: browserById(state.browserId ?? currentState.browserId).id,
  };
}
