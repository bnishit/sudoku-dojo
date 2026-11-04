# Sudoku Belts — iPhone shell

One iPhone app target, iOS 17+, SwiftUI and WebKit. Version 1.0, build 1, display name **Sudoku Belts**, portrait only. Fully free; no packages, purchases or StoreKit. Phases 1–3 were built and reviewed by Claude; Phase 4 code is written, pending Claude review. Store screenshots are still to do.

## Build

From the repository root, on a Mac with Xcode and the named simulator installed:

```sh
xcodebuild -project ios/SudokuBelts.xcodeproj -scheme SudokuBelts -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath ios/build build
```

Or open `ios/SudokuBelts.xcodeproj`, select the shared **SudokuBelts** scheme and an iPhone simulator, and Run. A physical device needs your signing team. Nishit handles archive/upload; confirm the bundle ID with him before the first archive.

## Bundle and saves

The blue folder reference `app` points to `../app` relative to the iOS project. The Resources phase includes that reference, so Xcode copies the current folder into `SudokuBelts.app/app` at build time, preserving the directory tree. There is no second source copy, copy script or web build.

`BundleSchemeHandler` serves those resources at the fixed origin `belts://app`. Every cold launch loads `belts://app/index.html#/learn`; the existing hash router handles all later screens. `WKWebsiteDataStore.default()` retains `sudoku-dojo-v1` across normal app updates. Do not change that origin or switch to an ephemeral store. Deleting the app still deletes its local progress; Safari progress is separate.

## Offline and appearance

No Fraunces/Nunito font files were available offline. Nothing was downloaded. The handler removes Google Fonts links from the served HTML and injects a shell-only CSS override using system rounded/sans and serif fonts. Web font links remain unchanged in the shared source. A shell-only content policy blocks network connections and permits only bundled resources, inline styles and local data/blob resources.

Service-worker registration is limited to HTTP(S), where it is supported; the custom scheme uses the bundle directly. The existing viewport and safe-area CSS handle the notch and home bar. The web view fills the screen without adding a second scroll inset; its background follows system light/dark colors and the status bar follows the system appearance. Pinch zoom, link previews and back/forward swipes are disabled. Board selection and touch callouts are disabled in shell CSS. Navigation stays on the bundled origin.

## Store assets and privacy

`Assets.xcassets/AppIcon.appiconset/AppIcon.png` is one universal iOS 1024×1024 RGB PNG, with no alpha channel. Offline SVG rendering was unavailable in the authoring sandbox (sips, Quick Look and headless Chrome failed). The largest existing raster, `app/icons/icon-512.png`, was flattened onto the icon's orange background (`#E8613C`), then upscaled with Pillow Lanczos. No web icon was changed.

`Info.plist` supplies `UILaunchScreen.UIColorName = LaunchBackground`; Xcode generates the remaining app metadata from build settings. The named asset matches the web page and existing native background: light `#F5EFE3`, dark `#14151B`. The catalog and `PrivacyInfo.xcprivacy` are included in the target's Resources phase; Info.plist is a build input, not a copied resource.

The privacy manifest sets tracking to false and leaves tracking domains, collected data types and required-reason APIs empty. Source review found no UserDefaults / @AppStorage, file timestamp, disk-space, boot-time or active-keyboard API calls. Progress and reminder settings use JavaScript localStorage in Apple's persistent WKWebView store. The backup bridge creates, writes and deletes a temporary file; it does not read timestamps. There are no third-party SDKs. Recheck the manifest if native storage or SDKs are added. See Apple's [required-reason API guidance](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api) and [launch colour key](https://developer.apple.com/documentation/bundleresources/information-property-list/uilaunchscreen/uicolorname).

## Before submitting

- [ ] Claude: build and review Phase 4. Check the installed icon, version 1.0 (1), name, iPhone-only support and portrait lock. Cold-launch in light and dark; check for a white flash, notch and home bar. Capture review evidence.
- [ ] Claude: run `npm test` and `npm run bank`; cold-launch offline, visit each main screen, then rebuild/reinstall without deleting the app and confirm XP, streak and saved game remain.
- [ ] Claude / Nishit: check backup to Files, restore, result sharing, silent-switch sound and haptics on a real phone. Confirm a reminder fires and tapping it opens Daily (the simulator tap path remains unverified).
- [ ] Claude: create the six light-mode store screenshots: lesson, hint, coach, belt ceremony, daily puzzle and Me. They are excluded from this code phase.
- [ ] Nishit: confirm `com.nishitbhatt.sudokubelts`, signing team and App Store Connect record; complete store copy, support/privacy URLs, age rating and **Data Not Collected** privacy answers.
- [ ] Nishit: archive, inspect the built app's icon, launch metadata and bundled privacy manifest, validate, then upload and submit when ready. No archive, upload or submission was done in this code phase.

Phase 4 local checks are source/resource validation and `npm test` only. Native build, asset compilation and launch appearance need Claude's review; they cannot be verified in the authoring sandbox.
