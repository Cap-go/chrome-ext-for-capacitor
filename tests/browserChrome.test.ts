import { describe, expect, it } from 'vitest';
import {
  browserById,
  browsers,
  CHROME_ANDROID_TOOLBAR,
  CHROME_IOS_TOOLBAR,
  frameChrome,
  pageFrame,
  paintFrameChrome,
} from '../src/browserChrome';
import type { FrameDevice } from '../src/browserChrome';

const iphone: FrameDevice = {
  id: 'iphone-18-pro',
  postureId: 'portrait',
  width: 402,
  height: 874,
  safeArea: { top: 62, right: 0, bottom: 34, left: 0 },
};

const pixel: FrameDevice = {
  id: 'pixel-10',
  postureId: 'portrait',
  width: 412,
  height: 924,
  safeArea: { top: 32, right: 0, bottom: 24, left: 0 },
};

const duoCover: FrameDevice = {
  id: 'iphone-duo',
  postureId: 'cover',
  width: 466,
  height: 678,
  safeArea: { top: 0, right: 84, bottom: 34, left: 0 },
};

const duoOpen: FrameDevice = {
  id: 'iphone-duo',
  postureId: 'unfolded',
  width: 951,
  height: 669,
  safeArea: { top: 0, right: 84, bottom: 0, left: 0 },
};

describe('browser chrome', () => {
  it('lists the September 2026 top five, with Chrome split by platform', () => {
    expect(browsers.map((browser) => browser.label)).toEqual([
      'App webview',
      'Safari · iOS',
      'Chrome · iOS',
      'Chrome · Android',
      'Samsung Internet',
      'Opera',
      'UC Browser',
    ]);
    expect(browserById('nope').id).toBe('app');
  });

  it('keeps an iOS browser on top of the full screen', () => {
    expect(pageFrame('app', iphone)).toMatchObject({ top: 0, left: 0, width: 402, height: 874, safeArea: iphone.safeArea });
    expect(pageFrame('safari-ios', iphone)).toMatchObject({ top: 0, width: 402, height: 874, safeArea: iphone.safeArea });
    expect(pageFrame('chrome-ios', iphone).safeArea).toEqual(iphone.safeArea);
    const chrome = frameChrome('chrome-ios', iphone, 'capgo.app');
    expect(chrome.layout).toBe('overlay');
    expect(chrome.floatingBottom).toBe(false);
    expect(chrome.bottomToolbar).toBe(CHROME_IOS_TOOLBAR);
    expect(frameChrome('safari-ios', iphone, 'capgo.app').floatingBottom).toBe(true);
  });

  it('puts Android toolbars outside the page and clears the insets they replace', () => {
    expect(pageFrame('chrome-android', pixel)).toEqual({
      top: 32 + CHROME_ANDROID_TOOLBAR,
      left: 0,
      width: 412,
      height: 924 - 32 - CHROME_ANDROID_TOOLBAR - 24,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    expect(pageFrame('samsung-internet', pixel)).toMatchObject({
      top: 32 + CHROME_ANDROID_TOOLBAR,
      height: 924 - 32 - CHROME_ANDROID_TOOLBAR - CHROME_ANDROID_TOOLBAR - 24,
    });
    expect(pageFrame('opera-android', pixel).top).toBe(32);
    expect(pageFrame('uc-browser', iphone)).toMatchObject({
      top: 62,
      height: 874 - 62 - CHROME_ANDROID_TOOLBAR - 34,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  });

  it('uses the published Safari 27.1 page box on iPhone Duo', () => {
    expect(pageFrame('safari-ios', duoCover)).toEqual({
      top: 0,
      left: 0,
      width: 382,
      height: 580,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    expect(pageFrame('safari-ios', duoOpen)).toEqual({
      top: 84,
      left: 0,
      width: 951,
      height: 585,
      safeArea: { top: 0, right: 84, bottom: 0, left: 0 },
    });
    const cover = frameChrome('safari-ios', duoCover, 'console.capgo.app');
    expect(cover.layout).toBe('reflow');
    expect(cover.floatingBottom).toBe(false);
    expect(cover.pageWidth).toBe(382);
  });

  it('keeps the painter free of module bindings executeScript would drop', () => {
    expect(paintFrameChrome.toString()).not.toContain('CHROME_ANDROID_TOOLBAR');
    expect(paintFrameChrome.toString()).not.toContain('browsers');
  });
});
