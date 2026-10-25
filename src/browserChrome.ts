import type { Insets } from './deviceConfigs';

/**
 * Mobile browser chrome drawn around the device frame.
 *
 * Statcounter, September 2026, mobile: Chrome 67.64%, Safari 24.71%,
 * Samsung Internet 3.5%, Opera 1.38%, UC Browser 0.78%.
 * Chrome is listed twice because its iOS and Android bars are different.
 *
 * Chrome for Android toolbar: 56dp (`toolbar_height_no_shadow`).
 * https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/android/omnibox/java/res/values/dimens.xml
 * Chrome for iOS bottom toolbar: 62pt (`kToolbarHeight`).
 * https://chromium.googlesource.com/chromium/src/+/main/ios/chrome/browser/toolbar/ui/toolbar_constants.mm
 * A dp or pt is one CSS pixel in the device viewport this extension already uses.
 *
 * Safari on iOS draws the page under the bar, so the bar is not a safe-area inset.
 * iPhone Duo is the exception WebKit measured: with the bar open, the outer page is
 * 382×580 and the inner landscape page is 951×585.
 * https://webkit.org/blog/18486/webkit-features-for-safari-27.1/
 *
 * Samsung, Opera, and UC do not publish toolbar heights. Their strips use Chrome's 56px.
 */

export const CHROME_ANDROID_TOOLBAR = 56;
export const CHROME_IOS_TOOLBAR = 62;

export const browserOrder = [
  'app',
  'safari-ios',
  'chrome-ios',
  'chrome-android',
  'samsung-internet',
  'opera-android',
  'uc-browser',
] as const;

export type BrowserId = typeof browserOrder[number];
export type BrowserKind = 'app' | 'safari' | 'chrome-ios' | 'chrome-android' | 'samsung' | 'opera' | 'uc';
export type BrowserLayout = 'app' | 'overlay' | 'reflow';

export interface BrowserChrome {
  id: BrowserId;
  label: string;
  kind: BrowserKind;
  layout: BrowserLayout;
  /** Address or button row under the status bar, in CSS px. */
  topToolbar: number;
  /** Address or button row above the home indicator, in CSS px. */
  bottomToolbar: number;
  /** Floating bottom pill. Generic Safari only; iPhone Duo uses WebKit's page box. */
  floatingBottom: boolean;
  note: string;
}

export const browsers: BrowserChrome[] = [
  {
    id: 'app',
    label: 'App webview',
    kind: 'app',
    layout: 'app',
    topToolbar: 0,
    bottomToolbar: 0,
    floatingBottom: false,
    note: 'App webview, the Capacitor default. No browser bars.',
  },
  {
    id: 'safari-ios',
    label: 'Safari · iOS',
    kind: 'safari',
    layout: 'overlay',
    topToolbar: 0,
    bottomToolbar: CHROME_IOS_TOOLBAR,
    floatingBottom: true,
    note: 'Safari on iOS draws over the page. The bar is not added to the safe area. The pill is 62px tall, which is Chrome\'s published iOS toolbar, not an Apple measurement. iPhone Duo instead uses the Safari 27.1 page size with the bar open.',
  },
  {
    id: 'chrome-ios',
    label: 'Chrome · iOS',
    kind: 'chrome-ios',
    layout: 'overlay',
    topToolbar: 0,
    bottomToolbar: CHROME_IOS_TOOLBAR,
    floatingBottom: false,
    note: 'Chrome on iOS draws a 62px bottom bar over the page (Chromium kToolbarHeight). The safe area stays the device insets.',
  },
  {
    id: 'chrome-android',
    label: 'Chrome · Android',
    kind: 'chrome-android',
    layout: 'reflow',
    topToolbar: CHROME_ANDROID_TOOLBAR,
    bottomToolbar: 0,
    floatingBottom: false,
    note: 'Chrome on Android places a 56px toolbar under the status bar, outside the page (Chromium toolbar_height_no_shadow).',
  },
  {
    id: 'samsung-internet',
    label: 'Samsung Internet',
    kind: 'samsung',
    layout: 'reflow',
    topToolbar: CHROME_ANDROID_TOOLBAR,
    bottomToolbar: CHROME_ANDROID_TOOLBAR,
    floatingBottom: false,
    note: 'Samsung Internet keeps the address bar on top and the buttons on the bottom. Those strips use Chrome\'s 56px toolbar because Samsung does not publish the height.',
  },
  {
    id: 'opera-android',
    label: 'Opera',
    kind: 'opera',
    layout: 'reflow',
    topToolbar: 0,
    bottomToolbar: CHROME_ANDROID_TOOLBAR,
    floatingBottom: false,
    note: 'Opera keeps the address bar at the bottom. The strip uses Chrome\'s 56px toolbar because Opera does not publish the height.',
  },
  {
    id: 'uc-browser',
    label: 'UC Browser',
    kind: 'uc',
    layout: 'reflow',
    topToolbar: 0,
    bottomToolbar: CHROME_ANDROID_TOOLBAR,
    floatingBottom: false,
    note: 'UC Browser is fifth by share. The bottom strip uses Chrome\'s 56px toolbar because UC does not publish the height.',
  },
];

export function browserById(id: string | undefined | null): BrowserChrome {
  return browsers.find((browser) => browser.id === id) ?? browsers[0];
}

export interface FrameDevice {
  id: string;
  postureId: string;
  width: number;
  height: number;
  safeArea: Insets;
}

export interface PageFrame {
  top: number;
  left: number;
  width: number;
  height: number;
  safeArea: Insets;
}

export interface FrameChrome {
  kind: BrowserKind;
  label: string;
  host: string;
  layout: BrowserLayout;
  floatingBottom: boolean;
  deviceWidth: number;
  deviceHeight: number;
  pageTop: number;
  pageLeft: number;
  pageWidth: number;
  pageHeight: number;
  /** Device status inset. Drawn above a reflow toolbar, not added on top of an overlay page. */
  statusInset: number;
  /** Device home or gesture inset. */
  homeInset: number;
  topToolbar: number;
  bottomToolbar: number;
}

function copyInsets(insets: Insets): Insets {
  return { top: insets.top, right: insets.right, bottom: insets.bottom, left: insets.left };
}

function fullFrame(device: FrameDevice): PageFrame {
  return {
    top: 0,
    left: 0,
    width: device.width,
    height: device.height,
    safeArea: copyInsets(device.safeArea),
  };
}

/**
 * Safari 27.1 on iPhone Duo, bar open.
 * Outer: 382×580 inside 466×678, controls on the trailing side and the tab bar at the bottom.
 * Inner landscape: 951×585, tab bar at the top (669 − 585 = 84).
 */
function duoSafariFrame(device: FrameDevice): PageFrame | null {
  if (device.id !== 'iphone-duo') return null;
  if (device.postureId === 'cover' && device.width === 466 && device.height === 678) {
    return {
      top: 0,
      left: 0,
      width: 382,
      height: 580,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    };
  }
  if (device.postureId === 'unfolded' && device.width === 951 && device.height === 669) {
    return {
      top: 669 - 585,
      left: 0,
      width: 951,
      height: 585,
      safeArea: { top: 0, right: device.safeArea.right, bottom: 0, left: device.safeArea.left },
    };
  }
  return null;
}

function reflowFrame(browser: BrowserChrome, device: FrameDevice): PageFrame {
  const top = device.safeArea.top + browser.topToolbar;
  const bottom = device.safeArea.bottom + browser.bottomToolbar;
  return {
    top,
    left: 0,
    width: device.width,
    height: Math.max(1, device.height - top - bottom),
    safeArea: {
      top: 0,
      right: device.safeArea.right,
      bottom: 0,
      left: device.safeArea.left,
    },
  };
}

/** Page box the iframe uses. Overlay browsers keep the full screen under the bars. */
export function pageFrame(browserId: string, device: FrameDevice): PageFrame {
  const browser = browserById(browserId);
  if (browser.layout === 'app' || device.width <= 0 || device.height <= 0) return fullFrame(device);
  if (browser.id === 'safari-ios') return duoSafariFrame(device) ?? fullFrame(device);
  if (browser.layout === 'reflow') return reflowFrame(browser, device);
  return fullFrame(device);
}

export function frameChrome(browserId: string, device: FrameDevice, host: string): FrameChrome {
  const browser = browserById(browserId);
  const frame = pageFrame(browser.id, device);
  const shrunk = frame.top !== 0 || frame.left !== 0 || frame.width !== device.width || frame.height !== device.height;
  return {
    kind: browser.kind,
    label: browser.label,
    host: host || 'Search',
    layout: browser.layout === 'app' ? 'app' : shrunk ? 'reflow' : browser.layout,
    floatingBottom: browser.floatingBottom && !shrunk,
    deviceWidth: device.width,
    deviceHeight: device.height,
    pageTop: frame.top,
    pageLeft: frame.left,
    pageWidth: frame.width,
    pageHeight: frame.height,
    statusInset: device.safeArea.top,
    homeInset: device.safeArea.bottom,
    topToolbar: browser.topToolbar,
    bottomToolbar: browser.bottomToolbar,
  };
}

/**
 * Draw the browser bars on the device stage. Serialized into the page by
 * executeScript, so every color and glyph it needs lives in this function.
 */
export function paintFrameChrome(hostId: string, spec: FrameChrome): void {
  const host = document.getElementById(hostId);
  const shadow = host?.shadowRoot;
  const stage = shadow?.querySelector('[data-stage]') as HTMLElement | null;
  const iframe = shadow?.querySelector('iframe') as HTMLIFrameElement | null;
  const caption = shadow?.querySelector('[data-caption]');
  if (!stage || !iframe) return;

  iframe.style.position = 'absolute';
  iframe.style.left = `${spec.pageLeft}px`;
  iframe.style.top = `${spec.pageTop}px`;
  iframe.style.width = `${spec.pageWidth}px`;
  iframe.style.height = `${spec.pageHeight}px`;
  stage.style.position = 'relative';

  shadow?.querySelector('[data-chrome]')?.remove();
  if (caption) {
    caption.textContent = spec.layout === 'app'
      ? `${spec.deviceWidth} × ${spec.deviceHeight}`
      : `${spec.pageWidth} × ${spec.pageHeight} · ${spec.label}`;
  }
  if (spec.layout === 'app' || spec.kind === 'app') return;

  const layer = document.createElement('div');
  layer.dataset.chrome = 'true';
  layer.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;font-family:-apple-system,system-ui,sans-serif;';
  stage.append(layer);

  const rowCss = 'display:flex;align-items:center;gap:8px;box-sizing:border-box;padding:0 10px;';

  function glyph(text: string, color: string) {
    const node = document.createElement('span');
    node.textContent = text;
    node.style.cssText = `flex:none;color:${color};font:600 18px/1 -apple-system,system-ui,sans-serif;width:28px;text-align:center;`;
    return node;
  }

  function address(parent: HTMLElement, textColor: string, field: string) {
    const fieldBox = document.createElement('div');
    fieldBox.style.cssText = `flex:1;min-width:0;display:flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:18px;background:${field};`;
    const label = document.createElement('span');
    label.textContent = spec.host;
    label.style.cssText = `flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:${textColor};font:600 14px/1.2 -apple-system,system-ui,sans-serif;`;
    fieldBox.append(glyph('•', textColor), label);
    parent.append(fieldBox);
  }

  function fill(top: number, height: number, background: string) {
    if (height <= 0) return null;
    const node = document.createElement('div');
    node.style.cssText = `position:absolute;left:${spec.pageLeft}px;width:${spec.pageWidth}px;top:${top}px;height:${height}px;background:${background};`;
    layer.append(node);
    return node;
  }

  if (spec.layout === 'overlay') {
    const bottom = spec.homeInset + (spec.floatingBottom ? 8 : 0);
    const bar = document.createElement('div');
    const inset = spec.floatingBottom ? 10 : 0;
    bar.style.cssText = [
      'position:absolute',
      `left:${spec.pageLeft + inset}px`,
      `width:${Math.max(0, spec.pageWidth - inset * 2)}px`,
      `bottom:${bottom}px`,
      `height:${spec.bottomToolbar}px`,
      spec.floatingBottom
        ? 'border-radius:31px;background:rgba(255,255,255,.92);box-shadow:0 6px 18px rgba(0,0,0,.18);backdrop-filter:blur(16px);'
        : 'background:#fff;border-top:1px solid #dadce0;',
      rowCss,
    ].join(';');
    bar.append(glyph('‹', '#007aff'), glyph('›', '#8e8e93'));
    address(bar, '#1d1d1f', spec.floatingBottom ? 'transparent' : '#f1f3f4');
    bar.append(glyph('▢', '#007aff'), glyph('···', '#007aff'));
    layer.append(bar);
    // Drawing of the home indicator in the gap under the bar, not a measured asset.
    if (spec.homeInset > 0) {
      const homePill = document.createElement('div');
      homePill.style.cssText = 'position:absolute;left:32%;right:32%;bottom:8px;height:4px;border-radius:4px;background:rgba(0,0,0,.28);';
      layer.append(homePill);
    }
    return;
  }

  const pageBottom = spec.pageTop + spec.pageHeight;
  const topGap = spec.pageTop;
  const bottomGap = Math.max(0, spec.deviceHeight - pageBottom);
  const rightGap = Math.max(0, spec.deviceWidth - spec.pageLeft - spec.pageWidth);
  const statusHeight = Math.min(spec.statusInset, topGap);
  const topBarHeight = Math.max(0, topGap - statusHeight);
  const homeHeight = Math.min(spec.homeInset, bottomGap);
  const bottomBarHeight = Math.max(0, bottomGap - homeHeight);

  if (statusHeight > 0) {
    const status = fill(0, statusHeight, '#000');
    if (status) {
      status.style.left = '0';
      status.style.width = `${spec.deviceWidth}px`;
      status.style.display = 'flex';
      status.style.alignItems = 'flex-end';
      status.style.justifyContent = 'space-between';
      status.style.boxSizing = 'border-box';
      status.style.padding = '0 12px 4px';
      status.style.color = '#fff';
      status.style.font = '600 12px/1 -apple-system,system-ui,sans-serif';
      const time = document.createElement('span');
      time.textContent = '9:41';
      const icons = document.createElement('span');
      icons.textContent = '5G  ▮';
      status.append(time, icons);
    }
  }

  if (topBarHeight > 0) {
    const topBar = fill(statusHeight, topBarHeight, '#fff');
    if (topBar) {
      topBar.style.cssText += rowCss;
      if (spec.kind === 'safari') {
        topBar.append(glyph('‹', '#007aff'), glyph('›', '#8e8e93'));
        address(topBar, '#1d1d1f', '#f1f3f4');
        topBar.append(glyph('▢', '#007aff'), glyph('···', '#007aff'));
      } else {
        address(topBar, '#1d1d1f', '#f1f3f4');
        topBar.append(glyph('1', '#1d1d1f'), glyph('···', '#1d1d1f'));
      }
    }
  }

  if (rightGap > 0) {
    const side = document.createElement('div');
    side.style.cssText = `position:absolute;top:0;right:0;width:${rightGap}px;height:${spec.deviceHeight}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:rgba(255,255,255,.94);`;
    side.append(glyph('↻', '#007aff'), glyph('↑', '#007aff'), glyph('▢', '#007aff'));
    layer.append(side);
  }

  if (bottomBarHeight > 0) {
    const bottomBar = fill(pageBottom, bottomBarHeight, '#fff');
    if (bottomBar) {
      bottomBar.style.borderTop = '1px solid #e5e5ea';
      bottomBar.style.cssText += rowCss;
      if (spec.kind === 'samsung') {
        for (const mark of ['‹', '›', '⌂', '▢', '☰']) bottomBar.append(glyph(mark, '#1d1d1f'));
        bottomBar.style.justifyContent = 'space-around';
      } else if (spec.kind === 'safari') {
        bottomBar.append(glyph('‹', '#007aff'), glyph('›', '#8e8e93'));
        address(bottomBar, '#1d1d1f', '#f1f3f4');
        bottomBar.append(glyph('▢', '#007aff'), glyph('···', '#007aff'));
      } else {
        const mark = document.createElement('span');
        mark.textContent = spec.kind === 'uc' ? 'UC' : 'O';
        mark.style.cssText = `flex:none;width:28px;height:28px;border-radius:14px;background:${spec.kind === 'uc' ? '#ff7a00' : '#e1122a'};color:#fff;font:700 11px/28px -apple-system,system-ui,sans-serif;text-align:center;`;
        bottomBar.append(mark);
        address(bottomBar, '#1d1d1f', '#f1f3f4');
        if (spec.kind === 'uc') bottomBar.append(glyph('⌂', '#ff7a00'));
        bottomBar.append(glyph('···', '#1d1d1f'));
      }
    }
  }

  if (homeHeight > 0) {
    const homeOnLight = spec.kind === 'safari';
    const home = fill(spec.deviceHeight - homeHeight, homeHeight, homeOnLight ? '#fff' : '#000');
    if (home) {
      home.style.left = '0';
      home.style.width = `${spec.deviceWidth}px`;
      const pill = document.createElement('div');
      pill.style.cssText = `position:absolute;left:32%;right:32%;bottom:6px;height:4px;border-radius:4px;background:${homeOnLight ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.85)'};`;
      home.append(pill);
    }
  }
}
