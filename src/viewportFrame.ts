import { frameChrome, pageFrame, paintFrameChrome } from './browserChrome';
import { cameraOverlayCss } from './cameraManager';
import { DeviceConfig, Insets } from './deviceConfigs';

export const DEVICE_FRAME_NAME = 'capacitor-safe-area-device';
const HOST_ID = 'capacitor-safe-area-frame';

/**
 * DevTools is already attached to the inspected tab, so the debugger API
 * cannot apply device metrics. A sized iframe is the layout viewport:
 * media queries inside it follow the device's CSS width and height.
 */
export function frameRequestDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname) return null;
    return parsed.hostname;
  } catch {
    return null;
  }
}

/** Fit a device into the visible area without going above its real CSS size. */
export function viewportScale(availableWidth: number, availableHeight: number, deviceWidth: number, deviceHeight: number, margin = 48): number {
  if (deviceWidth <= 0 || deviceHeight <= 0) return 1;
  const scale = Math.min(1, (availableWidth - margin) / deviceWidth, (availableHeight - margin) / deviceHeight);
  if (!Number.isFinite(scale) || scale <= 0) return 0.2;
  return Math.max(scale, 0.2);
}

export function frameBypassRule(tabId: number, domain: string): chrome.declarativeNetRequest.Rule {
  return {
    id: tabId,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      responseHeaders: [
        { header: 'x-frame-options', operation: 'remove' },
        { header: 'content-security-policy', operation: 'remove' },
        { header: 'content-security-policy-report-only', operation: 'remove' },
      ],
    },
    condition: {
      tabIds: [tabId],
      requestDomains: [domain],
      resourceTypes: ['sub_frame'],
    },
  };
}

export async function mountViewportFrame(tabId: number, device: DeviceConfig, browserId = 'app'): Promise<void> {
  if (!device.viewport) {
    await removeViewportFrame(tabId);
    return;
  }

  const tab = await chrome.tabs.get(tabId);
  const domain = tab.url ? frameRequestDomain(tab.url) : null;
  if (!domain || !tab.url) {
    throw new Error('Open an http or https page to size the device.');
  }

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [tabId],
    addRules: [frameBypassRule(tabId, domain)],
  });

  const screen = {
    id: device.id,
    postureId: device.postureId,
    width: device.viewport.width,
    height: device.viewport.height,
    safeArea: device.safeArea,
  };
  const frame = pageFrame(browserId, screen);
  let host = '';
  try {
    host = new URL(tab.url).hostname.replace(/^www\./, '');
  } catch {
    host = '';
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    func: prepareDeviceFrame,
    args: [screen.width, screen.height, frame.top, frame.left, frame.width, frame.height, DEVICE_FRAME_NAME, HOST_ID],
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    func: paintFrameChrome,
    args: [HOST_ID, frameChrome(browserId, screen, host)],
  });
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: loadDeviceFrame,
    args: [tab.url, tabId, HOST_ID],
  });

  if (result?.result === 'blocked') {
    throw new Error('This page refused to load at the device size.');
  }
}

export async function paintDeviceFrame(tabId: number, device: DeviceConfig, browserId = 'app'): Promise<'painted' | 'missing' | 'cross-origin'> {
  const frame = device.viewport
    ? pageFrame(browserId, {
      id: device.id,
      postureId: device.postureId,
      width: device.viewport.width,
      height: device.viewport.height,
      safeArea: device.safeArea,
    })
    : null;
  await chrome.scripting.executeScript({
    target: { tabId },
    func: installSimulatedSafeArea,
    args: [HOST_ID, frame?.safeArea ?? device.safeArea, device.hinge?.size ?? 0, device.hinge?.axis ?? 'none'],
  });
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: paintInPage,
    args: [device, HOST_ID, device.camera ? cameraOverlayCss(device.camera) : ''],
  });
  return result?.result ?? 'missing';
}

export async function applyDocumentSafeArea(tabId: number, device: DeviceConfig): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: installSimulatedSafeArea,
    args: [null, device.safeArea, device.hinge?.size ?? 0, device.hinge?.axis ?? 'none'],
  });
}

export async function removeViewportFrame(tabId: number): Promise<void> {
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId] }).catch(() => undefined);
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (hostId: string) => {
      const host = document.getElementById(hostId);
      if (!host) return;
      document.documentElement.style.overflow = host.dataset.htmlOverflow ?? '';
      document.body.style.overflow = host.dataset.bodyOverflow ?? '';
      host.remove();
    },
    args: [HOST_ID],
  }).catch(() => undefined);
}

function paintInPage(device: DeviceConfig, hostId: string, cameraCss: string): 'painted' | 'missing' | 'cross-origin' {
  const host = document.getElementById(hostId);
  const stage = host?.shadowRoot?.querySelector('[data-stage]') as HTMLElement | null;
  const iframe = host?.shadowRoot?.querySelector('iframe') as HTMLIFrameElement | null;
  if (!stage) return 'missing';

  // The page box can be smaller than the phone. Keep the cutout on the phone.
  try {
    iframe?.contentDocument?.getElementById('capacitor-safe-area-camera')?.remove();
    iframe?.contentDocument?.getElementById('capacitor-safe-area-hinge')?.remove();
  } catch {
    // A cross-origin document cannot be cleaned. The stage overlay is still drawn.
  }

  let camera = stage.querySelector('#capacitor-safe-area-camera') as HTMLElement | null;
  if (cameraCss) {
    if (!camera) {
      camera = document.createElement('div');
      camera.id = 'capacitor-safe-area-camera';
      stage.append(camera);
    }
    camera.style.cssText = cameraCss.replace('position:fixed', 'position:absolute').replace('z-index:10000', 'z-index:8');
  } else {
    camera?.remove();
  }

  let hinge = stage.querySelector('#capacitor-safe-area-hinge') as HTMLElement | null;
  if (!device.hinge) {
    hinge?.remove();
    return 'painted';
  }
  if (!hinge) {
    hinge = document.createElement('div');
    hinge.id = 'capacitor-safe-area-hinge';
    stage.append(hinge);
  }
  const { axis, size } = device.hinge;
  const band = axis === 'vertical'
    ? `top:0;bottom:0;left:50%;width:${size}px;transform:translateX(-50%);`
    : `left:0;right:0;top:50%;height:${size}px;transform:translateY(-50%);`;
  hinge.style.cssText = `position:absolute;${band}background:linear-gradient(${axis === 'vertical' ? 'to right' : 'to bottom'},transparent,rgba(120,120,120,.45),transparent);z-index:2;pointer-events:none;`;
  return 'painted';
}

/** Pages such as the Capgo console pad with env(safe-area-inset-*), which an iframe always reports as 0. */
export function rewriteSafeAreaEnv(css: string): string {
  return css.replace(
    /env\(\s*safe-area-inset-(top|right|bottom|left)\s*(?:,[^)]*)?\)/gi,
    (_match, edge: string) => `var(--safe-area-inset-${edge.toLowerCase()})`,
  );
}

export function installSimulatedSafeArea(
  target: Document | string | null,
  insets: Insets,
  hingeSize: number,
  hingeAxis: string,
): void {
  const supplied = target && typeof target === 'object' && 'documentElement' in target ? target : null;
  let doc = supplied;
  if (!doc) {
    if (typeof target === 'string' && target) {
      const host = document.getElementById(target);
      const iframe = host?.shadowRoot?.querySelector('iframe') as HTMLIFrameElement | null;
      if (!iframe) return;
      try {
        doc = iframe.contentDocument;
      } catch {
        return;
      }
    } else {
      doc = document;
    }
  }
  if (!doc?.documentElement) return;

  const rewrite = (css: string) => css.replace(
    /env\(\s*safe-area-inset-(top|right|bottom|left)\s*(?:,[^)]*)?\)/gi,
    (_match, edge: string) => `var(--safe-area-inset-${edge.toLowerCase()})`,
  );
  const edges = ['top', 'right', 'bottom', 'left'] as const;
  for (const edge of edges) {
    const value = `${insets[edge]}px`;
    for (const name of [`--ion-safe-area-${edge}`, `--k-safe-area-${edge}`, `--c-safe-area-${edge}`, `--safe-area-${edge}`, `--safe-area-inset-${edge}`]) {
      doc.documentElement.style.setProperty(name, value, 'important');
    }
  }
  doc.documentElement.style.setProperty('--simulation-hinge-size', `${hingeSize}px`, 'important');
  doc.documentElement.style.setProperty('--simulation-hinge-axis', hingeAxis, 'important');

  const styleId = 'capacitor-safe-area-env';
  const collect = (rules: CSSRuleList): string => {
    let out = '';
    for (let index = 0; index < rules.length; index += 1) {
      const rule = rules[index];
      const nested = (rule as CSSGroupingRule).cssRules;
      if (nested && nested.length > 0 && !('style' in rule)) {
        const inner = collect(nested);
        if (!inner) continue;
        const header = rule.cssText.slice(0, rule.cssText.indexOf('{')).trim();
        out += `${header}{${inner}}`;
        continue;
      }
      if (rule.cssText.includes('safe-area-inset-')) out += rewrite(rule.cssText);
    }
    return out;
  };

  const applySheets = () => {
    let css = '';
    for (const sheet of [...doc.styleSheets]) {
      const owner = sheet.ownerNode as HTMLElement | null;
      if (owner?.id === styleId) continue;
      if (owner?.tagName === 'LINK' && owner.dataset.safeAreaBound !== '1') {
        owner.dataset.safeAreaBound = '1';
        owner.addEventListener('load', () => applySheets());
      }
      try {
        if (sheet.cssRules) css += collect(sheet.cssRules);
      } catch {
        // A cross-origin sheet cannot be read or rewritten.
      }
    }
    for (const element of doc.querySelectorAll<HTMLElement>('[style*="safe-area-inset"]')) {
      const current = element.getAttribute('style') ?? '';
      const next = rewrite(current);
      if (next !== current) element.setAttribute('style', next);
    }
    let style = doc.getElementById(styleId);
    if (!css) {
      style?.remove();
      return;
    }
    if (!style) {
      style = doc.createElement('style');
      style.id = styleId;
      (doc.head ?? doc.documentElement).append(style);
    }
    if (style.textContent !== css) style.textContent = css;
  };

  applySheets();
  const root = doc.documentElement as HTMLElement & { __capacitorSafeAreaPatch?: { disconnect: () => void } };
  root.__capacitorSafeAreaPatch?.disconnect();
  if (typeof MutationObserver !== 'function') return;
  let applying = false;
  const observer = new MutationObserver(() => {
    if (applying) return;
    applying = true;
    try {
      applySheets();
    } finally {
      applying = false;
    }
  });
  observer.observe(doc.documentElement, { childList: true, subtree: true });
  root.__capacitorSafeAreaPatch = observer;
}

function prepareDeviceFrame(
  width: number,
  height: number,
  pageTop: number,
  pageLeft: number,
  pageWidth: number,
  pageHeight: number,
  frameName: string,
  hostId: string,
): void {
  // Keep fit inside this function. executeScript serializes only this function.
  function fitHost(host: HTMLElement) {
    const stage = host.shadowRoot?.querySelector('[data-stage]') as HTMLElement | null;
    if (!stage) return;
    const deviceWidth = Number(host.dataset.deviceWidth);
    const deviceHeight = Number(host.dataset.deviceHeight);
    const margin = 48;
    const availableWidth = document.documentElement.clientWidth - margin;
    const availableHeight = document.documentElement.clientHeight - margin;
    const scale = Math.min(1, availableWidth / deviceWidth, availableHeight / deviceHeight);
    stage.style.transform = `scale(${Math.max(Number.isFinite(scale) ? scale : 0.2, 0.2)})`;
  }

  function place(stage: HTMLElement, iframe: HTMLIFrameElement) {
    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;
    stage.style.position = 'relative';
    iframe.style.position = 'absolute';
    iframe.style.left = `${pageLeft}px`;
    iframe.style.top = `${pageTop}px`;
    iframe.style.width = `${pageWidth}px`;
    iframe.style.height = `${pageHeight}px`;
  }

  const existing = document.getElementById(hostId);
  if (existing) {
    existing.dataset.deviceWidth = String(width);
    existing.dataset.deviceHeight = String(height);
    const stage = existing.shadowRoot?.querySelector('[data-stage]') as HTMLElement | null;
    const iframe = existing.shadowRoot?.querySelector('iframe') as HTMLIFrameElement | null;
    if (stage && iframe) {
      place(stage, iframe);
      fitHost(existing);
      return;
    }
    existing.remove();
  }

  const host = document.createElement('div');
  host.id = hostId;
  host.dataset.deviceWidth = String(width);
  host.dataset.deviceHeight = String(height);
  host.dataset.htmlOverflow = document.documentElement.style.overflow;
  host.dataset.bodyOverflow = document.body.style.overflow;
  host.style.cssText = 'all:initial;display:block;position:fixed;inset:0;width:100%;height:100%;z-index:2147483646;';
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  const shadow = host.attachShadow({ mode: 'open' });
  const backdrop = document.createElement('div');
  backdrop.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#12141c;overflow:hidden;';

  const stage = document.createElement('div');
  stage.dataset.stage = 'true';
  stage.style.cssText = `position:relative;width:${width}px;height:${height}px;flex:none;background:#000;overflow:hidden;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.45);transform-origin:center center;`;

  const iframe = document.createElement('iframe');
  iframe.name = frameName;
  iframe.title = 'Device viewport';
  iframe.style.cssText = `position:absolute;left:${pageLeft}px;top:${pageTop}px;width:${pageWidth}px;height:${pageHeight}px;border:0;display:block;background:#fff;z-index:1;`;
  stage.append(iframe);

  const caption = document.createElement('div');
  caption.dataset.caption = 'true';
  caption.textContent = `${width} × ${height}`;
  caption.style.cssText = 'flex:none;color:#c5cad6;font:600 13px/1.2 system-ui,sans-serif;';

  backdrop.append(stage, caption);
  shadow.append(backdrop);
  document.documentElement.append(host);
  fitHost(host);
  window.addEventListener('resize', () => {
    const current = document.getElementById(hostId);
    if (current) fitHost(current);
  });
}

function loadDeviceFrame(url: string, tabId: number, hostId: string): Promise<'mounted' | 'resized' | 'blocked'> {
  function frameStatus(frame: HTMLIFrameElement, expectedUrl: string): 'mounted' | 'blocked' | 'pending' {
    try {
      const href = frame.contentWindow?.location.href ?? '';
      if (!href || href === 'about:blank') return 'pending';
      if (href.startsWith('chrome-error:')) return 'blocked';
      return 'mounted';
    } catch {
      // A same-origin target that throws is Chrome's blocked-frame error page.
      try {
        if (new URL(expectedUrl).origin === location.origin) return 'blocked';
      } catch {
        return 'blocked';
      }
      return 'mounted';
    }
  }

  const iframe = document.getElementById(hostId)?.shadowRoot?.querySelector('iframe') as HTMLIFrameElement | null;
  if (!iframe) return Promise.resolve('blocked');
  if (iframe.dataset.loadedUrl === url) return Promise.resolve('resized');

  return new Promise((resolve) => {
    let initial = true;
    const timer = window.setTimeout(() => resolve('blocked'), 12000);
    iframe.onload = () => {
      const status = frameStatus(iframe, url);
      if (status === 'pending') return;
      if (initial) {
        initial = false;
        window.clearTimeout(timer);
        if (status === 'mounted') iframe.dataset.loadedUrl = url;
        resolve(status);
        return;
      }
      chrome.runtime.sendMessage({ action: 'deviceFrameLoaded', tabId });
    };
    iframe.src = url;
  });
}
