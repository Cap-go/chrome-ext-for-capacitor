import { DeviceConfig } from './deviceConfigs';
import { applySafeArea, removeSafeArea } from './safeAreaManager';
import { applyCamera, applyHinge, removeCamera, removeHinge } from './cameraManager';
import { mountViewportFrame, paintDeviceFrame, removeViewportFrame } from './viewportFrame';

export async function applyInsets(tabId: number, device: DeviceConfig, browserId = 'app') {
  const painted = await paintDeviceFrame(tabId, device, browserId);
  if (painted !== 'painted') {
    await applySafeArea(tabId, device);
    if (device.camera) {
      await applyCamera(tabId, device, true);
    } else {
      await removeCamera(tabId);
    }
    await applyHinge(tabId, device);
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (activeDevice: DeviceConfig) => {
      window.dispatchEvent(new CustomEvent('activateSafeArea', { detail: activeDevice }));
      const setStatus = (window as Window & { setSimulationStatus?: (status: { isActive: boolean; isCameraVisible: boolean; currentDeviceName: string }) => void }).setSimulationStatus;
      setStatus?.({
        isActive: true,
        isCameraVisible: !!activeDevice.camera,
        currentDeviceName: activeDevice.name,
      });
    },
    args: [device],
  });
}

export async function applySimulation(tabId: number, device: DeviceConfig, browserId = 'app') {
  if (!device?.safeArea) throw new Error('Invalid device configuration');
  try {
    await mountViewportFrame(tabId, device, browserId);
    await applyInsets(tabId, device, browserId);
  } catch (error) {
    await removeViewportFrame(tabId);
    throw error;
  }
}

export async function removeSimulation(tabId: number) {
  await removeSafeArea(tabId).catch(() => undefined);
  await removeCamera(tabId).catch(() => undefined);
  await removeHinge(tabId).catch(() => undefined);
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      window.dispatchEvent(new Event('resetSafeArea'));
      const setStatus = (window as Window & { setSimulationStatus?: (status: { isActive: boolean; isCameraVisible: boolean; currentDeviceName: string }) => void }).setSimulationStatus;
      setStatus?.({ isActive: false, isCameraVisible: false, currentDeviceName: '' });
    },
  }).catch(() => undefined);
  await removeViewportFrame(tabId);
}
