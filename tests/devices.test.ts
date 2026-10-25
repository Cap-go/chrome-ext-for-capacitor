import { describe, expect, it } from 'vitest';
import { cameraOverlayCss } from '../src/cameraManager';
import { deviceCatalog, deviceConfigFromState, resolveDevice } from '../src/deviceConfigs';

const bookFoldables = [
  'iphone-duo',
  'galaxy-z-fold-8',
  'galaxy-z-fold-8-ultra',
  'galaxy-z-fold-7',
  'galaxy-z-fold-6',
  'pixel-10-pro-fold',
  'pixel-9-pro-fold',
];

describe('device catalog', () => {
  it('uses a unique id for every device and posture', () => {
    const ids = deviceCatalog.map((device) => device.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const device of deviceCatalog) {
      const postureIds = device.postures.map((posture) => posture.id);
      expect(new Set(postureIds).size).toBe(postureIds.length);
    }
  });

  it('gives book-style foldables a cover and an unfolded display', () => {
    for (const id of bookFoldables) {
      const device = deviceCatalog.find((entry) => entry.id === id);
      expect(device?.postures.map((posture) => posture.id)).toEqual(['cover', 'unfolded']);
      expect(device?.formFactor).toBe('foldable');
    }
  });

  it('models iPhone Duo from the iOS 27.1 simulator windows', () => {
    const cover = resolveDevice('iphone-duo', 'cover');
    const unfolded = resolveDevice('iphone-duo', 'unfolded');

    expect(cover).toMatchObject({
      platform: 'ios',
      safeArea: { top: 0, right: 84, bottom: 34, left: 0 },
      viewport: { width: 466, height: 678 },
    });
    expect(cover?.camera).toEqual({ top: 29.3, right: 29.3, width: 37, height: 37, shape: 'round' });
    expect(cover?.camera && cameraOverlayCss(cover.camera)).toBe(
      'position:fixed;top:29.3px;right:29.3px;width:37px;height:37px;background:#000;border-radius:50%;z-index:10000;pointer-events:none;display:block;',
    );
    expect(unfolded).toMatchObject({
      safeArea: { top: 0, right: 84, bottom: 0, left: 0 },
      viewport: { width: 951, height: 669 },
      hinge: { axis: 'vertical', size: 40 },
    });
    expect(unfolded?.camera).toEqual({ top: 21, left: 677.3, width: 58, height: 37, shape: 'pill' });
    expect(unfolded?.camera && cameraOverlayCss(unfolded.camera)).toBe(
      'position:fixed;top:21px;left:677.3px;width:58px;height:37px;background:#000;border-radius:18.5px;z-index:10000;pointer-events:none;display:block;',
    );
  });

  it('keeps an unfolded book camera off the hinge', () => {
    for (const id of bookFoldables) {
      const device = resolveDevice(id, 'unfolded');
      const camera = device?.camera;
      const width = device?.viewport?.width ?? 0;
      expect(camera).toBeDefined();
      const center = camera?.left !== undefined
        ? camera.left + camera.width / 2
        : width - (camera?.right ?? 0) - (camera?.width ?? 0) / 2;
      expect(Math.abs(center - width / 2)).toBeGreaterThan(40);
    }

    expect(resolveDevice('galaxy-z-fold-8', 'unfolded')?.camera).toMatchObject({ top: 8, left: 721, width: 16, height: 16 });
    expect(resolveDevice('galaxy-z-fold-8', 'cover')?.camera).toEqual({ top: 8, width: 16, height: 16, shape: 'round' });
    expect(resolveDevice('pixel-9-pro-fold', 'unfolded')?.camera).toEqual({ top: 8, right: 8, width: 16, height: 16, shape: 'round' });
    expect(resolveDevice('pixel-10-pro-fold', 'unfolded')?.camera).toEqual({ top: 8, right: 8, width: 16, height: 16, shape: 'round' });
  });

  it('keeps insets and viewports in range', () => {
    for (const device of deviceCatalog) {
      for (const posture of device.postures) {
        for (const value of Object.values(posture.safeArea)) {
          expect(value).toBeGreaterThanOrEqual(0);
        }
        if (posture.viewport) {
          expect(posture.viewport.width).toBeGreaterThan(0);
          expect(posture.viewport.height).toBeGreaterThan(0);
        }
      }
    }
  });

  it('restores a saved iPhone 14 Pro Max that has no id', () => {
    const restored = deviceConfigFromState({
      name: 'iPhone 14 Pro Max',
      safeArea: { top: 59, right: 0, bottom: 34, left: 0 },
    });
    expect(restored.id).toBe('iphone-14-pro-max');
    expect(restored.safeArea.top).toBe(59);
    expect(restored.platform).toBe('ios');
  });

  it('treats iPad as iOS', () => {
    expect(resolveDevice('ipad-pro-13-m4')?.platform).toBe('ios');
  });
});
