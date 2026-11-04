# Sudoku Belts — iPhone shell

Phase 1 code only. One iPhone app target, iOS 17+, SwiftUI and WebKit. No packages, purchases or StoreKit. Not built or run in the authoring sandbox; Claude must review it in the simulator before Phase 2.

## Build

From the repository root, on a Mac with Xcode and the named simulator installed:

```sh
xcodebuild -project ios/SudokuBelts.xcodeproj -scheme SudokuBelts -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath ios/build build
```

Or open `ios/SudokuBelts.xcodeproj`, select the shared **SudokuBelts** scheme and an iPhone simulator, and Run. A physical device needs your signing team. Confirm the bundle ID with Nishit before the first archive; do not archive or submit as part of this phase.

## Bundle and saves

The blue folder reference `app` points to `../app` relative to the iOS project. The Resources phase includes that reference, so Xcode copies the current folder into `SudokuBelts.app/app` at build time, preserving the directory tree. There is no second source copy, copy script or web build.

`BundleSchemeHandler` serves those resources at the fixed origin `belts://app`. Every cold launch loads `belts://app/index.html#/learn`; the existing hash router handles all later screens. `WKWebsiteDataStore.default()` retains `sudoku-dojo-v1` across normal app updates. Do not change that origin or switch to an ephemeral store. Deleting the app still deletes its local progress; Safari progress is separate.

## Offline and appearance

No Fraunces/Nunito font files were available offline. Nothing was downloaded. The handler removes Google Fonts links from the served HTML and injects a shell-only CSS override using system rounded/sans and serif fonts. Web font links remain unchanged in the shared source. A shell-only content policy blocks network connections and permits only bundled resources, inline styles and local data/blob resources.

Service-worker registration is limited to HTTP(S), where it is supported; the custom scheme uses the bundle directly. The existing viewport and safe-area CSS handle the notch and home bar. The web view fills the screen without adding a second scroll inset; its background follows system light/dark colors and the status bar follows the system appearance. Pinch zoom, link previews and back/forward swipes are disabled. Board selection and touch callouts are disabled in shell CSS. Navigation stays on the bundled origin.

## Review before the next phase

- Build, then cold-launch in airplane mode. Visit Learn, a lesson, Play, a game, Practice, Rush, Daily and Me; check module loading and hash navigation.
- Earn XP, close/reopen, then rebuild/reinstall without deleting the app. Confirm XP, streak and the saved game remain.
- Check light/dark at phone width, including a full board, top bar, bottom tabs, notch and home bar. Capture real screenshots. Check zoom, board long press, link preview and edge swipe.
- Inspect for failed resources or remote requests. Check missing bundle resources fail rather than hanging.

Local checks (2026-11-04): `npm test` passed all 16 checks; `npm run bank` verified 560 items and left the generated bank unchanged. The project passed `plutil -lint`; project references, scheme XML and entry-page resources also passed static checks. These checks do not prove native build success or offline/save behavior. Simulator review is pending. Backup downloads, native haptics, sharing, audio-session setup and reminders remain Phase 2/3 work. App icon, launch artwork and privacy/store preparation remain Phase 4 work. No native message bridge is added until it has Phase 2 actions to handle.
