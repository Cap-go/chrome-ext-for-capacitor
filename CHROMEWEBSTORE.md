# Chrome Web Store Listing — Capacitor Safe Area Simulator

> Last Updated: 2026-10-24

Item ID: `ddaaodgcccedhjbjeollookhomplefhi`
Live version: 1.0.4 (updated 2024-07-24)
Package ready to upload: `extension.zip` (version 1.1.0). The zip contains only `manifest.json`, `dist/`, and `assets/`.

## Store Listing

**Extension Name** [REQUIRED]

Capacitor Safe Area Simulator

**Short Description** [REQUIRED]

Simulates safe areas and mobile browser bars for Capacitor apps, including foldables such as iPhone Duo

**Detailed Description** [REQUIRED]

Check Capacitor safe-area layouts in Chrome DevTools without installing the app on a phone.

Open DevTools on the page you are building, select the Capacitor Safe Area panel, pick a device, and turn the simulation on. The page is shown at that device's CSS size. Ionic, Konsta UI, and Tailwind Capacitor layouts follow the device insets, including pages that read the system safe-area values.

The device list includes current phones, tablets, and foldables. iPhone 18 Pro and iPhone 18 Pro Max are at the top of the iPhone group. iPhone Duo, Galaxy Z Fold 8, Galaxy Z Fold 8 Ultra, Galaxy Z Fold 7, Galaxy Z Fold 6, Pixel 10 Pro Fold, and Pixel 9 Pro Fold each have a cover view and an unfolded view. The crease is drawn on the screen and is not added to the four edge insets. Older phones from the 1.0 list are still included.

A Browser menu adds the bars of Safari, Chrome on iOS, Chrome on Android, Samsung Internet, Opera, or UC Browser. Those are the top mobile browsers. Chrome is listed twice because the iOS bar and the Android bar sit in different places. The app webview is the default and draws no bars.

Safari and Chrome on iOS draw over the page. The safe area stays the device's status bar and home indicator. On iPhone Duo, Safari uses the published page size with the bar open. Chrome on Android places its toolbar outside the page. Samsung Internet keeps the address bar on top and the buttons on the bottom. Opera and UC Browser keep the address bar at the bottom.

The chosen device and browser for the inspected tab are stored on this computer. Nothing is sent to a server. The extension does not sell data, use analytics, or read the page for its own purposes.

HOW TO USE
1. Install the extension.
2. Open DevTools on your app.
3. Open the Capacitor Safe Area panel.
4. Pick a device. For a foldable, pick Cover or Unfolded.
5. Pick App webview, or a mobile browser.
6. Turn the simulation on.

SUPPORT
https://github.com/Cap-go/chrome-ext-for-capacitor/issues
hello@forgr.ee

Version 1.1.0 adds current phones and foldables, including iPhone 18 Pro, iPhone 18 Pro Max, and iPhone Duo, plus mobile browser bars.

**Category** [REQUIRED]

Developer Tools

**Single Purpose** [REQUIRED]

Simulates device safe-area insets and mobile browser bars for Capacitor layouts in Chrome DevTools.

**Primary Language** [REQUIRED]

English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | assets/icon128.png. Blue phone with the top and bottom safe-area bands. Toolbar sizes are assets/icon16.png and assets/icon48.png. |
| Screenshot 1 [REQUIRED] | 1280×800 JPEG | ✅ Ready | store/screenshot-1-iphone-18-pro.jpg |
| Screenshot 2 | 1280×800 JPEG | ✅ Ready | store/screenshot-2-safari.jpg |
| Screenshot 3 | 1280×800 JPEG | ✅ Ready | store/screenshot-3-duo-cover.jpg |
| Screenshot 4 | 1280×800 JPEG | ✅ Ready | store/screenshot-4-duo-unfolded.jpg |
| Screenshot 5 | 1280×800 JPEG | ✅ Ready | store/screenshot-5-chrome-android.jpg |
| Small Promo Tile [RECOMMENDED] | 440×280 JPEG | ✅ Ready | store/promo-small-440x280.jpg |
| Marquee Promo Tile [RECOMMENDED] | 1400×560 JPEG | ✅ Ready | store/promo-marquee-1400x560.jpg |

The image files are in the main checkout, `/Users/martindonadieu/Projects/capgo_all/chrome-ext-for-capacitor/store/`. Paste-ready listing text is `store-description.txt` in that same checkout.

### Screenshot Notes

Each screenshot is the device frame on the dark stage, with the Capacitor Safe Area panel docked at the bottom. 1 is iPhone 18 Pro as an app webview. 2 is the same phone with Safari. 3 is iPhone Duo cover. 4 is iPhone Duo unfolded with Safari. 5 is Pixel 10 with Chrome on Android. JPEG, no alpha.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| activeTab | permissions | The panel runs against the tab open in DevTools when the user turns the simulation on or changes device. |
| declarativeNetRequestWithHostAccess | permissions | While a simulation is on, drops framing headers for subframe loads of that tab so the page can be shown at the device size. The rule is removed when the simulation turns off. |
| scripting | permissions | Inserts and removes the safe-area style rules on the page the user is inspecting. |
| storage | permissions | Remembers the selected device, the browser bars, and whether the simulation is on for that tab. The values stay in local storage on this computer. |
| `<all_urls>` | host_permissions | Capacitor apps are opened from localhost, preview hosts, and production domains. The simulator has to run on whichever page is open in DevTools, so the host list cannot be limited to one site. The same match list is used for the content script. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

The extension stores the selected device and the on/off state for the inspected tab in `chrome.storage.local`. That data stays on the computer. It is not synced, not sent to a server, and not shared. There is no analytics and no account.

The live listing already discloses that the extension does not collect or use user data. This release does not change that.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | | No |
| Health info | No | No | | No |
| Financial info | No | No | | No |
| Authentication info | No | No | | No |
| Personal communications | No | No | | No |
| Location | No | No | | No |
| Web history | No | No | | No |
| User activity | No | No | | No |
| Website content | No | No | | No |

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]

Keep the URL already saved on the live listing. Do not replace it with https://capgo.app/privacy/. That page describes the Capgo service, which does collect account data, and it does not describe this extension.

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]

Digital Shift OU

**Contact Email** [REQUIRED]

hello@forgr.ee

**Support URL / Email** [RECOMMENDED]

https://github.com/Cap-go/chrome-ext-for-capacitor/issues

**Homepage URL** [RECOMMENDED]

https://capgo.app


## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.1.0 | 2026-10-24 | Current phones, tablets, and foldables, including iPhone 18 Pro, iPhone 18 Pro Max, and iPhone Duo cover and unfolded postures. Device search, a posture control, and browser bars for Safari, Chrome on iOS and Android, Samsung Internet, Opera, and UC Browser. | Draft, package built, not submitted |
| 1.0.4 | 2024-07-24 | Live store version. | Published |

## Review Notes

### Known Issues / Limitations

Inside the device frame, env(safe-area-inset-*) in the page's styles is rewritten to the simulated insets. Foldable creases are visual and are not added to the edge insets. Several Android status-bar and gesture-bar sizes are estimates and are labeled in the device list source. Samsung, Opera, and UC toolbar heights are not published; those strips use Chrome's 56px toolbar. Safari's floating pill uses Chrome's 62px iOS toolbar. iPhone Duo's Safari page box uses the WebKit 27.1 sizes.

### Submission blocker

The package is `extension.zip` in the project root. Upload was not sent. The Google accounts available on this machine do not have the Chrome Web Store scope, and `martin@capgo.app` needs a fresh sign-in. The publisher account that owns item `ddaaodgcccedhjbjeollookhomplefhi` has to approve that scope before the zip can be published.
