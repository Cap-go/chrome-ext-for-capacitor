import { CameraCutout, DeviceConfig } from './deviceConfigs';

/** CSS for the hardware cutout. A side camera keeps its measured top; it is not centered on the edge. */
export function cameraOverlayCss(camera: CameraCutout): string {
  const radius = camera.shape === 'round' ? '50%' : `${Math.min(camera.width, camera.height) / 2}px`;
  const anchor = camera.right !== undefined
    ? `top:${camera.top}px;right:${camera.right}px;`
    : camera.left !== undefined
      ? `top:${camera.top}px;left:${camera.left}px;`
      : `top:${camera.top}px;left:50%;transform:translateX(-50%);`;
  return `position:fixed;${anchor}width:${camera.width}px;height:${camera.height}px;background:#000;border-radius:${radius};z-index:10000;pointer-events:none;display:block;`;
}

export async function applyCamera(tabId: number, device: DeviceConfig, isCameraVisible: boolean) {
  const css = device.camera && isCameraVisible ? cameraOverlayCss(device.camera) : '';
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (css: string) => {
      let cameraElement = document.getElementById('capacitor-safe-area-camera');
      if (!css) {
        cameraElement?.remove();
        return;
      }
      if (!cameraElement) {
        cameraElement = document.createElement('div');
        cameraElement.id = 'capacitor-safe-area-camera';
        document.body.appendChild(cameraElement);
      }
      cameraElement.style.cssText = css;
    },
    args: [css],
  });
}

export async function removeCamera(tabId: number) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      document.getElementById('capacitor-safe-area-camera')?.remove();
    },
  });
}

export async function applyHinge(tabId: number, device: DeviceConfig) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (device: DeviceConfig) => {
      let hinge = document.getElementById('capacitor-safe-area-hinge');
      if (!device.hinge) {
        hinge?.remove();
        return;
      }
      if (!hinge) {
        hinge = document.createElement('div');
        hinge.id = 'capacitor-safe-area-hinge';
        document.body.appendChild(hinge);
      }
      const { axis, size } = device.hinge;
      const band = axis === 'vertical'
        ? `top: 0; bottom: 0; left: 50%; width: ${size}px; transform: translateX(-50%);`
        : `left: 0; right: 0; top: 50%; height: ${size}px; transform: translateY(-50%);`;
      hinge.style.cssText = `
        position: fixed;
        ${band}
        background: linear-gradient(${axis === 'vertical' ? 'to right' : 'to bottom'}, transparent, rgba(120, 120, 120, 0.45), transparent);
        z-index: 9998;
        pointer-events: none;
      `;
    },
    args: [device],
  });
}

export async function removeHinge(tabId: number) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      document.getElementById('capacitor-safe-area-hinge')?.remove();
    },
  });
}
