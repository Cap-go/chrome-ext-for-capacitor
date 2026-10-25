import { browserById, browsers, pageFrame } from './browserChrome';
import { defaultDevice, DeviceConfig, deviceCatalog, findDefinition, groupOrder } from './deviceConfigs';

const deviceSearch = document.getElementById('deviceSearch') as HTMLInputElement;
const deviceSelector = document.getElementById('deviceSelector') as HTMLSelectElement;
const postureField = document.getElementById('postureField') as HTMLDivElement;
const postureSelector = document.getElementById('postureSelector') as HTMLSelectElement;
const browserSelector = document.getElementById('browserSelector') as HTMLSelectElement;
const toggleSimulation = document.getElementById('toggleSimulation') as HTMLInputElement;
const statusElement = document.getElementById('status') as HTMLDivElement;
const deviceDetails = document.getElementById('deviceDetails') as HTMLParagraphElement;

interface PanelResponse {
  success?: boolean;
  error?: string;
  state?: {
    isActive: boolean;
    currentDevice: DeviceConfig;
    browserId?: string;
  };
}

function inspectedTabId(): number {
  const tabId = chrome.devtools?.inspectedWindow?.tabId;
  if (!tabId) throw new Error('DevTools inspected tab is unavailable');
  return tabId;
}

async function sendMessage(message: { action: string; deviceId?: string; postureId?: string; browserId?: string; isActive?: boolean }): Promise<PanelResponse> {
  return chrome.tabs.sendMessage(inspectedTabId(), message);
}

function selectedDefinition() {
  return findDefinition(deviceSelector.value);
}

function renderDevices(selectedId: string) {
  const query = deviceSearch.value.trim().toLowerCase();
  deviceSelector.replaceChildren();

  for (const group of groupOrder) {
    const matches = deviceCatalog.filter((device) => {
      if (device.group !== group) return false;
      if (!query || device.id === selectedId) return true;
      return `${device.name} ${device.group}`.toLowerCase().includes(query);
    });
    if (matches.length === 0) continue;

    const optgroup = document.createElement('optgroup');
    optgroup.label = group;
    for (const device of matches) {
      const option = document.createElement('option');
      option.value = device.id;
      option.textContent = device.name;
      optgroup.appendChild(option);
    }
    deviceSelector.appendChild(optgroup);
  }

  if (findDefinition(selectedId)) deviceSelector.value = selectedId;
}

function renderPostures(deviceId: string, postureId: string) {
  const definition = findDefinition(deviceId);
  postureSelector.replaceChildren();
  if (!definition || definition.postures.length < 2) {
    postureField.hidden = true;
    return;
  }

  postureField.hidden = false;
  for (const posture of definition.postures) {
    const option = document.createElement('option');
    option.value = posture.id;
    option.textContent = posture.label;
    postureSelector.appendChild(option);
  }
  postureSelector.value = definition.postures.some((posture) => posture.id === postureId)
    ? postureId
    : definition.postures[0].id;
}

function renderBrowsers(selectedId: string) {
  if (browserSelector.options.length === 0) {
    for (const browser of browsers) {
      const option = document.createElement('option');
      option.value = browser.id;
      option.textContent = browser.label;
      browserSelector.append(option);
    }
  }
  browserSelector.value = browserById(selectedId).id;
}

function describeDevice(device: DeviceConfig, browserId: string) {
  const browser = browserById(browserId);
  const parts: string[] = [];
  if (device.viewport) {
    const frame = pageFrame(browser.id, {
      id: device.id,
      postureId: device.postureId,
      width: device.viewport.width,
      height: device.viewport.height,
      safeArea: device.safeArea,
    });
    parts.push(`Safe area ${frame.safeArea.top}, ${frame.safeArea.right}, ${frame.safeArea.bottom}, ${frame.safeArea.left} (top, right, bottom, left).`);
    const moved = frame.top !== 0 || frame.left !== 0 || frame.width !== device.viewport.width || frame.height !== device.viewport.height;
    parts.push(moved
      ? `Page ${frame.width}×${frame.height} on a ${device.viewport.width}×${device.viewport.height} screen.`
      : `Viewport ${device.viewport.width}×${device.viewport.height}.`);
  } else {
    const { safeArea } = device;
    parts.push(`Safe area ${safeArea.top}, ${safeArea.right}, ${safeArea.bottom}, ${safeArea.left} (top, right, bottom, left).`);
    if (browser.id !== 'app') parts.push('This device has no CSS viewport, so the browser frame is not drawn.');
  }
  if (device.hinge) parts.push(`Crease ${device.hinge.size}px ${device.hinge.axis}.`);
  parts.push(browser.note);
  if (browser.id !== 'app') {
    parts.push('Statcounter’s September 2026 mobile list is Chrome, Safari, Samsung Internet, Opera, and UC Browser.');
  }
  if (device.note) parts.push(device.note);
  deviceDetails.textContent = parts.join(' ');
}

function updateUI(isActive: boolean, currentDevice: DeviceConfig | null, browserId = 'app') {
  toggleSimulation.checked = isActive;
  statusElement.textContent = isActive ? 'Simulation Active' : 'Simulation Inactive';
  statusElement.className = isActive ? 'font-bold text-green-500' : 'font-bold text-red-500';

  const deviceId = currentDevice?.id && findDefinition(currentDevice.id)
    ? currentDevice.id
    : deviceSelector.value || defaultDevice().id;
  renderDevices(deviceId);
  renderPostures(deviceSelector.value, currentDevice?.postureId ?? 'portrait');
  renderBrowsers(browserId);
  const definition = selectedDefinition();
  const posture = definition?.postures.find((item) => item.id === postureSelector.value) ?? definition?.postures[0];
  if (currentDevice?.safeArea) {
    describeDevice(currentDevice, browserSelector.value);
  } else if (definition && posture) {
    describeDevice({
      id: definition.id,
      name: definition.name,
      platform: definition.platform,
      formFactor: definition.formFactor,
      postureId: posture.id,
      postureLabel: posture.label,
      safeArea: posture.safeArea,
      viewport: posture.viewport,
      hinge: posture.hinge,
      note: posture.note,
    }, browserSelector.value);
  }
}

async function changeDevice() {
  const response = await sendMessage({
    action: 'changeDevice',
    deviceId: deviceSelector.value,
    postureId: postureField.hidden ? undefined : postureSelector.value,
    browserId: browserSelector.value,
  });
  if (!response?.success || !response.state) {
    throw new Error(response?.error ?? 'Failed to change device');
  }
  updateUI(response.state.isActive, response.state.currentDevice, response.state.browserId);
}

deviceSearch.addEventListener('input', () => {
  renderDevices(deviceSelector.value);
});

deviceSelector.addEventListener('change', async () => {
  renderPostures(deviceSelector.value, selectedDefinition()?.postures[0]?.id ?? 'portrait');
  try {
    await changeDevice();
  } catch (error) {
    console.error('Error changing device:', error);
    showError(error);
  }
});

browserSelector.addEventListener('change', async () => {
  try {
    const response = await sendMessage({ action: 'changeBrowser', browserId: browserSelector.value });
    if (!response?.success || !response.state) {
      throw new Error(response?.error ?? 'Failed to change browser');
    }
    updateUI(response.state.isActive, response.state.currentDevice, response.state.browserId);
  } catch (error) {
    console.error('Error changing browser:', error);
    showError(error);
  }
});

postureSelector.addEventListener('change', async () => {
  try {
    await changeDevice();
  } catch (error) {
    console.error('Error changing posture:', error);
    showError(error);
  }
});

toggleSimulation.addEventListener('change', async () => {
  const isChecked = toggleSimulation.checked;
  try {
    const response = await sendMessage({ action: 'toggleSimulation', isActive: isChecked });
    if (!response?.success || !response.state) {
      throw new Error(response?.error ?? 'Failed to toggle simulation');
    }
    updateUI(response.state.isActive, response.state.currentDevice, response.state.browserId);
  } catch (error) {
    console.error('Error toggling simulation:', error);
    toggleSimulation.checked = !isChecked;
    showError(error);
  }
});

function showError(error: unknown) {
  statusElement.textContent = error instanceof Error ? error.message : 'Simulation failed';
  statusElement.className = 'font-bold text-red-500';
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: { action?: string; tabId?: number; state?: { isActive: boolean; currentDevice: DeviceConfig; browserId?: string } }) => {
    if (message.action !== 'updateState' || !message.state) return;
    if (message.tabId && message.tabId !== chrome.devtools?.inspectedWindow?.tabId) return;
    updateUI(message.state.isActive, message.state.currentDevice, message.state.browserId);
  });
}

try {
  if (typeof chrome === 'undefined' || !chrome.devtools?.inspectedWindow?.tabId) {
    updateUI(false, null);
  } else {
    const response = await sendMessage({ action: 'getState' });
    if (response?.success && response.state) {
      updateUI(response.state.isActive, response.state.currentDevice, response.state.browserId);
    } else {
      updateUI(false, null);
    }
  }
} catch (error) {
  console.error('Error getting initial state:', error);
  updateUI(false, null);
}
