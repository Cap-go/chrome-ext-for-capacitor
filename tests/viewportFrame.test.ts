import { describe, expect, it } from 'vitest';
import { frameBypassRule, frameRequestDomain, installSimulatedSafeArea, rewriteSafeAreaEnv, viewportScale } from '../src/viewportFrame';

describe('device frame', () => {
  it('reads the hostname for an http(s) page', () => {
    expect(frameRequestDomain('https://capgo.app/pricing')).toBe('capgo.app');
    expect(frameRequestDomain('http://localhost:3000/app')).toBe('localhost');
    expect(frameRequestDomain('chrome://extensions')).toBeNull();
    expect(frameRequestDomain('not a url')).toBeNull();
  });

  it('scales a device down to the free area and never above 1', () => {
    expect(viewportScale(1600, 1200, 402, 874)).toBe(1);
    expect(viewportScale(500, 400, 402, 874)).toBeCloseTo((400 - 48) / 874);
    expect(viewportScale(40, 40, 402, 874)).toBe(0.2);
  });

  it('rewrites browser safe-area env values to the simulated variables', () => {
    expect(rewriteSafeAreaEnv('padding-top:max(.75rem, env(safe-area-inset-top))'))
      .toBe('padding-top:max(.75rem, var(--safe-area-inset-top))');
    expect(rewriteSafeAreaEnv('--safe-area-top:env(safe-area-inset-top,0px);--safe-area-bottom:env(safe-area-inset-bottom, 0px)'))
      .toBe('--safe-area-top:var(--safe-area-inset-top);--safe-area-bottom:var(--safe-area-inset-bottom)');
    expect(rewriteSafeAreaEnv('color:red')).toBe('color:red');
  });

  it('installs console safe-area rules from the page stylesheet', () => {
    const props = new Map<string, string>();
    let styleText = '';
    const styleElement = {
      id: '',
      get textContent() { return styleText; },
      set textContent(value: string) { styleText = value; },
    };
    const doc = {
      documentElement: { style: { setProperty: (name: string, value: string) => props.set(name, value) } },
      head: { append(node: { id: string }) { node.id ||= 'capacitor-safe-area-env'; } },
      styleSheets: [{
        ownerNode: { id: '', tagName: 'STYLE' },
        cssRules: [
          { cssText: '.pt-\\[max\\(0\\.75rem\\,env\\(safe-area-inset-top\\)\\)\\]{padding-top:max(.75rem, env(safe-area-inset-top))}', style: {} },
          { cssText: ':root{--safe-area-top:env(safe-area-inset-top,0px)}', style: {} },
        ],
      }],
      querySelectorAll: () => [],
      getElementById: (id: string) => styleElement.id === id ? styleElement : null,
      createElement: () => styleElement,
    };
    installSimulatedSafeArea(doc as unknown as Document, { top: 62, right: 0, bottom: 34, left: 0 }, 0, 'none');
    expect(props.get('--safe-area-inset-top')).toBe('62px');
    expect(props.get('--safe-area-top')).toBe('62px');
    expect(props.get('--ion-safe-area-bottom')).toBe('34px');
    expect(styleText).toContain('padding-top:max(.75rem, var(--safe-area-inset-top))');
    expect(styleText).toContain('--safe-area-top:var(--safe-area-inset-top)');
    expect(installSimulatedSafeArea.toString()).toContain('var(--safe-area-inset-');
  });

  it('strips framing headers only for subframes of the simulated tab', () => {
    const rule = frameBypassRule(7, 'capgo.app');
    expect(rule.id).toBe(7);
    expect(rule.condition.resourceTypes).toEqual(['sub_frame']);
    expect(rule.condition.tabIds).toEqual([7]);
    expect(rule.condition.requestDomains).toEqual(['capgo.app']);
    expect(rule.action.responseHeaders?.map((header) => header.header)).toEqual([
      'x-frame-options',
      'content-security-policy',
      'content-security-policy-report-only',
    ]);
  });
});
