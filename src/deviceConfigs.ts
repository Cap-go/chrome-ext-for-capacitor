/**
 * Safe-area presets for the DevTools panel.
 *
 * iOS insets are CSS points from WebKit `env(safe-area-inset-*)` groupings
 * (Dynamic Island 62 or 59, notch 50/48/47/44, home indicator 34, iPad 24/20).
 * iPhone Duo insets and windows are the iOS 27.1 simulator figures: cover is
 * 466×678 with an 84pt trailing bar and a 34pt home indicator; unfolded is the
 * 951×669 landscape window with that trailing bar and a 40pt crease.
 * The cover camera occlusion is 37×37 at (399.7, 29.3). Open sideways, the
 * inner camera is the inactive occlusion at (677.3, 21, 58×37).
 * https://foldhunt.com/guides/iphone-duo-screen-sizes/
 *
 * Book-style Android cameras are not centered on the whole canvas. Samsung's
 * inner camera sits in the middle of the trailing half. Pixel 9 and 10 Pro
 * Fold inner cameras are a punch hole in the top trailing corner. Cover
 * cameras stay centered. The hole is centered in that device's top inset.
 *
 * Android CSS viewports are published logical pixels where a source states
 * them, otherwise `physical pixels / (ppi / 160)`. Gesture-navigation insets
 * use a 24px bottom bar. Legacy presets keep the values this extension shipped
 * before the 2026 catalog.
 */

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CameraCutout {
  top: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
  shape: 'round' | 'pill';
}

export interface Hinge {
  axis: 'vertical' | 'horizontal';
  size: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface DevicePosture {
  id: string;
  label: string;
  safeArea: Insets;
  viewport?: Viewport;
  camera?: CameraCutout;
  hinge?: Hinge;
  note?: string;
}

export type DevicePlatform = 'ios' | 'android';
export type DeviceFormFactor = 'phone' | 'tablet' | 'foldable' | 'flip';

export interface DeviceDefinition {
  id: string;
  name: string;
  platform: DevicePlatform;
  formFactor: DeviceFormFactor;
  group: string;
  postures: DevicePosture[];
}

/** Flat preset the simulators apply and the panel stores. */
export interface DeviceConfig {
  id: string;
  name: string;
  platform: DevicePlatform;
  formFactor: DeviceFormFactor;
  postureId: string;
  postureLabel: string;
  safeArea: Insets;
  viewport?: Viewport;
  camera?: CameraCutout;
  hinge?: Hinge;
  note?: string;
}

export const groupOrder = ['iPhone', 'Foldables', 'iPad', 'Pixel', 'Samsung', 'Other'] as const;

const DEFAULT_DEVICE_ID = 'iphone-18-pro';

const dynamicIsland: CameraCutout = { top: 11, width: 126, height: 37, shape: 'pill' };
const notch: CameraCutout = { top: 0, width: 156, height: 34, shape: 'pill' };
const wideNotch: CameraCutout = { top: 0, width: 209, height: 30, shape: 'pill' };
const punchDiameter = 16;
// Cover occlusion from the iOS 27.1 simulator: (399.7, 29.3, 37×37) in a 466-wide window.
const duoCoverCamera: CameraCutout = { top: 29.3, right: 29.3, width: 37, height: 37, shape: 'round' };
// Open sideways occlusion from the same simulator: (677.3, 21, 58×37) in the 951×669 window.
const duoInnerCamera: CameraCutout = { top: 21, left: 677.3, width: 58, height: 37, shape: 'pill' };

function centeredPunch(statusBar: number): CameraCutout {
  return {
    top: Math.max(0, (statusBar - punchDiameter) / 2),
    width: punchDiameter,
    height: punchDiameter,
    shape: 'round',
  };
}

function panelPunch(width: number, statusBar: number): CameraCutout {
  return {
    top: Math.max(0, (statusBar - punchDiameter) / 2),
    left: Math.round((width * 0.75 - punchDiameter / 2) * 10) / 10,
    width: punchDiameter,
    height: punchDiameter,
    shape: 'round',
  };
}

function cornerPunch(statusBar: number): CameraCutout {
  const inset = Math.max(8, (statusBar - punchDiameter) / 2);
  return { top: inset, right: inset, width: punchDiameter, height: punchDiameter, shape: 'round' };
}

function insets(top: number, right = 0, bottom = 0, left = 0): Insets {
  return { top, right, bottom, left };
}

function slab(options: {
  id: string;
  name: string;
  platform: DevicePlatform;
  group: string;
  safeArea: Insets;
  viewport?: Viewport;
  camera?: CameraCutout;
  formFactor?: DeviceFormFactor;
  note?: string;
}): DeviceDefinition {
  return {
    id: options.id,
    name: options.name,
    platform: options.platform,
    formFactor: options.formFactor ?? (options.group === 'iPad' ? 'tablet' : 'phone'),
    group: options.group,
    postures: [{
      id: 'portrait',
      label: 'Portrait',
      safeArea: options.safeArea,
      viewport: options.viewport,
      camera: options.camera,
      note: options.note,
    }],
  };
}

function foldable(options: {
  id: string;
  name: string;
  platform: DevicePlatform;
  postures: DevicePosture[];
}): DeviceDefinition {
  return {
    id: options.id,
    name: options.name,
    platform: options.platform,
    formFactor: 'foldable',
    group: 'Foldables',
    postures: options.postures,
  };
}

export const deviceCatalog: DeviceDefinition[] = [
  slab({ id: 'iphone-18-pro-max', name: 'iPhone 18 Pro Max', platform: 'ios', group: 'iPhone', safeArea: insets(62, 0, 34), viewport: { width: 440, height: 956 }, camera: dynamicIsland }),
  slab({ id: 'iphone-18-pro', name: 'iPhone 18 Pro', platform: 'ios', group: 'iPhone', safeArea: insets(62, 0, 34), viewport: { width: 402, height: 874 }, camera: dynamicIsland }),
  slab({ id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', platform: 'ios', group: 'iPhone', safeArea: insets(62, 0, 34), viewport: { width: 440, height: 956 }, camera: dynamicIsland }),
  slab({ id: 'iphone-17-pro', name: 'iPhone 17 Pro', platform: 'ios', group: 'iPhone', safeArea: insets(62, 0, 34), viewport: { width: 402, height: 874 }, camera: dynamicIsland }),
  slab({ id: 'iphone-air', name: 'iPhone Air', platform: 'ios', group: 'iPhone', safeArea: insets(62, 0, 34), viewport: { width: 420, height: 912 }, camera: dynamicIsland }),
  slab({ id: 'iphone-17', name: 'iPhone 17', platform: 'ios', group: 'iPhone', safeArea: insets(62, 0, 34), viewport: { width: 402, height: 874 }, camera: dynamicIsland }),
  slab({ id: 'iphone-17e', name: 'iPhone 17e', platform: 'ios', group: 'iPhone', safeArea: insets(47, 0, 34), viewport: { width: 390, height: 844 }, camera: notch }),
  slab({ id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', platform: 'ios', group: 'iPhone', safeArea: insets(62, 0, 34), viewport: { width: 440, height: 956 }, camera: dynamicIsland }),
  slab({ id: 'iphone-16-pro', name: 'iPhone 16 Pro', platform: 'ios', group: 'iPhone', safeArea: insets(62, 0, 34), viewport: { width: 402, height: 874 }, camera: dynamicIsland }),
  slab({ id: 'iphone-16-plus', name: 'iPhone 16 Plus', platform: 'ios', group: 'iPhone', safeArea: insets(59, 0, 34), viewport: { width: 430, height: 932 }, camera: dynamicIsland }),
  slab({ id: 'iphone-16', name: 'iPhone 16', platform: 'ios', group: 'iPhone', safeArea: insets(59, 0, 34), viewport: { width: 393, height: 852 }, camera: dynamicIsland }),
  slab({ id: 'iphone-16e', name: 'iPhone 16e', platform: 'ios', group: 'iPhone', safeArea: insets(47, 0, 34), viewport: { width: 390, height: 844 }, camera: notch }),
  slab({ id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', platform: 'ios', group: 'iPhone', safeArea: insets(59, 0, 34), viewport: { width: 430, height: 932 }, camera: dynamicIsland }),
  slab({ id: 'iphone-15', name: 'iPhone 15 / 15 Pro', platform: 'ios', group: 'iPhone', safeArea: insets(59, 0, 34), viewport: { width: 393, height: 852 }, camera: dynamicIsland }),
  slab({ id: 'iphone-14-pro-max', name: 'iPhone 14 Pro Max', platform: 'ios', group: 'iPhone', safeArea: insets(59, 0, 34), viewport: { width: 430, height: 932 }, camera: dynamicIsland }),
  slab({ id: 'iphone-14', name: 'iPhone 14 / 14 Plus', platform: 'ios', group: 'iPhone', safeArea: insets(47, 0, 34), viewport: { width: 390, height: 844 }, camera: notch, note: '14 Plus is the same insets at 428×926.' }),
  slab({ id: 'iphone-13-mini', name: 'iPhone 13 mini', platform: 'ios', group: 'iPhone', safeArea: insets(50, 0, 34), viewport: { width: 375, height: 812 }, camera: notch }),
  slab({ id: 'iphone-12-pro', name: 'iPhone 12 Pro', platform: 'ios', group: 'iPhone', safeArea: insets(47, 0, 34), viewport: { width: 390, height: 844 }, camera: notch }),
  slab({ id: 'iphone-xr', name: 'iPhone XR', platform: 'ios', group: 'iPhone', safeArea: insets(48, 0, 34), viewport: { width: 414, height: 896 }, camera: wideNotch }),
  slab({ id: 'iphone-se', name: 'iPhone SE', platform: 'ios', group: 'iPhone', safeArea: insets(20), viewport: { width: 375, height: 667 }, note: '3rd generation, home button.' }),

  foldable({
    id: 'iphone-duo',
    name: 'iPhone Duo',
    platform: 'ios',
    postures: [
      {
        id: 'cover',
        label: 'Cover',
        safeArea: insets(0, 84, 34, 0),
        viewport: { width: 466, height: 678 },
        camera: duoCoverCamera,
        note: '5.4″ outer display. The front camera is a 37pt circle in the top trailing corner. The 84pt column is the status bar.',
      },
      {
        id: 'unfolded',
        label: 'Unfolded',
        safeArea: insets(0, 84, 0, 0),
        viewport: { width: 951, height: 669 },
        camera: duoInnerCamera,
        hinge: { axis: 'vertical', size: 40 },
        note: '7.6″ inner display, held open. The crease is 40pt. The under-display camera is the 58×37 region at (677.3, 21), on the trailing half.',
      },
    ],
  }),
  foldable({
    id: 'galaxy-z-fold-8',
    name: 'Galaxy Z Fold 8',
    platform: 'android',
    postures: [
      {
        id: 'cover',
        label: 'Cover',
        safeArea: insets(32, 0, 24),
        viewport: { width: 467, height: 737 },
        camera: centeredPunch(32),
        note: '5.5″ 10:16 cover. CSS pixels are the 1248×1972 panel at 428ppi.',
      },
      {
        id: 'unfolded',
        label: 'Unfolded',
        safeArea: insets(32, 0, 24),
        viewport: { width: 972, height: 734 },
        camera: panelPunch(972, 32),
        hinge: { axis: 'vertical', size: 24 },
        note: '7.6″ 4:3 inner display, held wide. CSS pixels are the 2448×1848 panel at 403ppi.',
      },
    ],
  }),
  foldable({
    id: 'galaxy-z-fold-8-ultra',
    name: 'Galaxy Z Fold 8 Ultra',
    platform: 'android',
    postures: [
      {
        id: 'cover',
        label: 'Cover',
        safeArea: insets(32, 0, 24),
        viewport: { width: 410, height: 956 },
        camera: centeredPunch(32),
        note: '6.5″ cover, 1080×2520 at 422ppi.',
      },
      {
        id: 'unfolded',
        label: 'Unfolded',
        safeArea: insets(32, 0, 24),
        viewport: { width: 855, height: 949 },
        camera: panelPunch(855, 32),
        hinge: { axis: 'vertical', size: 24 },
        note: '8″ inner display, 2256×2504 at 422ppi.',
      },
    ],
  }),
  foldable({
    id: 'galaxy-z-fold-7',
    name: 'Galaxy Z Fold 7',
    platform: 'android',
    postures: [
      {
        id: 'cover',
        label: 'Cover',
        safeArea: insets(38, 0, 24),
        viewport: { width: 412, height: 960 },
        camera: centeredPunch(38),
      },
      {
        id: 'unfolded',
        label: 'Unfolded',
        safeArea: insets(38, 0, 24),
        viewport: { width: 750, height: 832 },
        camera: panelPunch(750, 38),
        hinge: { axis: 'vertical', size: 24 },
      },
    ],
  }),
  foldable({
    id: 'galaxy-z-fold-6',
    name: 'Galaxy Z Fold 6',
    platform: 'android',
    postures: [
      {
        id: 'cover',
        label: 'Cover',
        safeArea: insets(32, 0, 24),
        viewport: { width: 369, height: 905 },
        camera: centeredPunch(32),
      },
      {
        id: 'unfolded',
        label: 'Unfolded',
        safeArea: insets(32, 0, 24),
        viewport: { width: 707, height: 823 },
        camera: panelPunch(707, 32),
        hinge: { axis: 'vertical', size: 24 },
      },
    ],
  }),
  slab({
    id: 'galaxy-z-flip-8',
    name: 'Galaxy Z Flip 8',
    platform: 'android',
    group: 'Foldables',
    formFactor: 'flip',
    safeArea: insets(32, 0, 24),
    viewport: { width: 360, height: 840 },
    camera: centeredPunch(32),
    note: 'Main display. The cover screen is a widget display, not the app viewport.',
  }),
  foldable({
    id: 'pixel-10-pro-fold',
    name: 'Pixel 10 Pro Fold',
    platform: 'android',
    postures: [
      {
        id: 'cover',
        label: 'Cover',
        safeArea: insets(32, 0, 24),
        viewport: { width: 412, height: 924 },
        camera: centeredPunch(32),
        note: '6.4″ cover, 1080×2424 at 2.625×.',
      },
      {
        id: 'unfolded',
        label: 'Unfolded',
        safeArea: insets(32, 0, 24),
        viewport: { width: 791, height: 820 },
        camera: cornerPunch(32),
        hinge: { axis: 'vertical', size: 24 },
        note: '8″ inner display. The punch hole is in the top trailing corner.',
      },
    ],
  }),
  foldable({
    id: 'pixel-9-pro-fold',
    name: 'Pixel 9 Pro Fold',
    platform: 'android',
    postures: [
      {
        id: 'cover',
        label: 'Cover',
        safeArea: insets(32, 0, 24),
        viewport: { width: 412, height: 922 },
        camera: centeredPunch(32),
      },
      {
        id: 'unfolded',
        label: 'Unfolded',
        safeArea: insets(32, 0, 24),
        viewport: { width: 791, height: 820 },
        camera: cornerPunch(32),
        hinge: { axis: 'vertical', size: 24 },
        note: 'Inner punch hole in the top trailing corner.',
      },
    ],
  }),
  slab({ id: 'galaxy-z-fold-5', name: 'Galaxy Z Fold 5', platform: 'android', group: 'Foldables', formFactor: 'foldable', safeArea: insets(32), camera: { top: 0, width: 120, height: 32, shape: 'pill' }, note: 'Original single inset, kept for saved sessions.' }),

  slab({ id: 'ipad-pro-13-m4', name: 'iPad Pro 13″', platform: 'ios', group: 'iPad', safeArea: insets(24, 0, 20), viewport: { width: 1032, height: 1376 }, note: 'Portrait. M4 and M5 share this logical size.' }),
  slab({ id: 'ipad-pro-11-m4', name: 'iPad Pro 11″', platform: 'ios', group: 'iPad', safeArea: insets(24, 0, 20), viewport: { width: 834, height: 1210 } }),
  slab({ id: 'ipad-air-11', name: 'iPad Air 11″', platform: 'ios', group: 'iPad', safeArea: insets(24, 0, 20), viewport: { width: 820, height: 1180 } }),
  slab({ id: 'ipad-mini', name: 'iPad mini', platform: 'ios', group: 'iPad', safeArea: insets(24, 0, 20), viewport: { width: 744, height: 1133 } }),
  slab({ id: 'ipad-pro', name: 'iPad Pro', platform: 'ios', group: 'iPad', safeArea: insets(24, 20, 20, 20), note: 'Earlier preset with side insets. Kept for saved sessions.' }),

  slab({ id: 'pixel-10-pro-xl', name: 'Pixel 10 Pro XL', platform: 'android', group: 'Pixel', safeArea: insets(32, 0, 24), viewport: { width: 448, height: 997 }, camera: centeredPunch(32) }),
  slab({ id: 'pixel-10-pro', name: 'Pixel 10 Pro', platform: 'android', group: 'Pixel', safeArea: insets(32, 0, 24), viewport: { width: 410, height: 914 }, camera: centeredPunch(32) }),
  slab({ id: 'pixel-10', name: 'Pixel 10', platform: 'android', group: 'Pixel', safeArea: insets(32, 0, 24), viewport: { width: 412, height: 924 }, camera: centeredPunch(32) }),
  slab({ id: 'pixel-9-pro', name: 'Pixel 9 Pro', platform: 'android', group: 'Pixel', safeArea: insets(32, 0, 24), viewport: { width: 427, height: 952 }, camera: centeredPunch(32) }),
  slab({ id: 'pixel-8', name: 'Pixel 8', platform: 'android', group: 'Pixel', safeArea: insets(32, 0, 24), viewport: { width: 412, height: 915 }, camera: centeredPunch(32) }),
  slab({ id: 'pixel-7', name: 'Pixel 7', platform: 'android', group: 'Pixel', safeArea: insets(24), viewport: { width: 412, height: 915 }, camera: { top: 0, width: 140, height: 24, shape: 'pill' } }),

  slab({ id: 'galaxy-s26-ultra', name: 'Galaxy S26 Ultra', platform: 'android', group: 'Samsung', safeArea: insets(32, 0, 24), viewport: { width: 412, height: 891 }, camera: centeredPunch(32), note: 'FHD+ default. QHD+ reports a smaller CSS viewport.' }),
  slab({ id: 'galaxy-s26', name: 'Galaxy S26', platform: 'android', group: 'Samsung', safeArea: insets(32, 0, 24), viewport: { width: 360, height: 780 }, camera: centeredPunch(32) }),
  slab({ id: 'galaxy-s25-ultra', name: 'Galaxy S25 Ultra', platform: 'android', group: 'Samsung', safeArea: insets(32, 0, 24), viewport: { width: 384, height: 832 }, camera: centeredPunch(32) }),
  slab({ id: 'galaxy-s25', name: 'Galaxy S25', platform: 'android', group: 'Samsung', safeArea: insets(32, 0, 24), viewport: { width: 360, height: 780 }, camera: centeredPunch(32) }),
  slab({ id: 'galaxy-s24', name: 'Galaxy S24', platform: 'android', group: 'Samsung', safeArea: insets(32, 0, 24), viewport: { width: 360, height: 780 }, camera: centeredPunch(32) }),
  slab({ id: 'galaxy-a55', name: 'Galaxy A55', platform: 'android', group: 'Samsung', safeArea: insets(32, 0, 24), viewport: { width: 384, height: 832 }, camera: centeredPunch(32) }),
  slab({ id: 'galaxy-s21', name: 'Samsung Galaxy S21', platform: 'android', group: 'Samsung', safeArea: insets(40), camera: { top: 6, width: 12, height: 12, shape: 'round' } }),
  slab({ id: 'galaxy-s20-ultra', name: 'Samsung Galaxy S20 Ultra', platform: 'android', group: 'Samsung', safeArea: insets(38), camera: { top: 0, width: 120, height: 38, shape: 'round' } }),
  slab({ id: 'galaxy-s8-plus', name: 'Samsung Galaxy S8+', platform: 'android', group: 'Samsung', safeArea: insets(24) }),
  slab({ id: 'galaxy-a51', name: 'Samsung Galaxy A51/71', platform: 'android', group: 'Samsung', safeArea: insets(32), camera: { top: 0, width: 100, height: 32, shape: 'round' } }),

  slab({ id: 'xiaomi-mi-11', name: 'Xiaomi Mi 11', platform: 'android', group: 'Other', safeArea: insets(40), camera: { top: 6, left: 20, width: 12, height: 12, shape: 'round' } }),
];

export function displayName(definition: DeviceDefinition, posture: DevicePosture): string {
  if (definition.postures.length === 1) return definition.name;
  return `${definition.name} · ${posture.label}`;
}

export function resolveDevice(deviceId: string, postureId?: string): DeviceConfig | undefined {
  const definition = deviceCatalog.find((device) => device.id === deviceId);
  if (!definition) return undefined;
  const posture = definition.postures.find((item) => item.id === postureId) ?? definition.postures[0];
  if (!posture) return undefined;
  return {
    id: definition.id,
    name: displayName(definition, posture),
    platform: definition.platform,
    formFactor: definition.formFactor,
    postureId: posture.id,
    postureLabel: posture.label,
    safeArea: posture.safeArea,
    viewport: posture.viewport,
    camera: posture.camera,
    hinge: posture.hinge,
    note: posture.note,
  };
}

export function defaultDevice(): DeviceConfig {
  const device = resolveDevice(DEFAULT_DEVICE_ID);
  if (!device) throw new Error(`Missing default device ${DEFAULT_DEVICE_ID}`);
  return device;
}

export function findDefinition(deviceId: string): DeviceDefinition | undefined {
  return deviceCatalog.find((device) => device.id === deviceId);
}

/** Restore a preset from storage, including catalogs saved before ids existed. */
export function deviceConfigFromState(stored: Partial<DeviceConfig> | undefined): DeviceConfig {
  if (stored?.id) {
    const resolved = resolveDevice(stored.id, stored.postureId);
    if (resolved) return resolved;
  }

  if (stored?.name) {
    for (const definition of deviceCatalog) {
      for (const posture of definition.postures) {
        if (displayName(definition, posture) === stored.name || definition.name === stored.name) {
          const resolved = resolveDevice(definition.id, posture.id);
          if (resolved) return resolved;
        }
      }
    }
  }

  if (stored?.safeArea) {
    return {
      id: stored.id ?? 'custom',
      name: stored.name ?? 'Custom',
      platform: stored.platform ?? (/iphone|ipad/i.test(stored.name ?? '') ? 'ios' : 'android'),
      formFactor: stored.formFactor ?? 'phone',
      postureId: stored.postureId ?? 'portrait',
      postureLabel: stored.postureLabel ?? 'Portrait',
      safeArea: stored.safeArea,
      viewport: stored.viewport,
      camera: stored.camera,
      hinge: stored.hinge,
      note: stored.note,
    };
  }

  return defaultDevice();
}

export const devices: DeviceConfig[] = deviceCatalog.flatMap((definition) =>
  definition.postures.map((posture) => resolveDevice(definition.id, posture.id)).filter((device): device is DeviceConfig => !!device),
);
