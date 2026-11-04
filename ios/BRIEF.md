# Brief for Codex: Sudoku Belts for iPhone

**You build. Claude reviews every phase in the iOS Simulator before the next one starts.**
Read `AGENTS.md` and `TASKS.md` first. Everything in them still applies.

## Goal

Ship Sudoku Belts on the App Store as a thin native shell around the existing web app in `app/`.
The puzzles, lessons, coach and hints stay in JavaScript, exactly as they are. The shell adds what only an iPhone app can do.

**Why a shell, not a rewrite:** `app/js/engine.js` is checked against every bank position by `npm test` and `npm run bank`. A Swift copy would drift and could teach a wrong move. One engine serves the web and the iPhone.

## Hard rules

1. **Never fork the engine or the lesson copy.** The iOS app loads the same `app/` folder. Don't copy it by hand. Use an Xcode folder reference or a build phase that copies `app/` into the bundle.
2. **Fully offline.** Load from the bundle, not from the Vercel URL. Nothing may need the network: fonts, icons, puzzles.
3. **No server, no accounts, no analytics, no ads.** The privacy label must read "Data Not Collected".
4. **Never lose a save.** Progress lives in `localStorage` key `sudoku-dojo-v1`. Use the default persistent `WKWebsiteDataStore` and a fixed origin, so the key survives app updates.
5. **The web app keeps working.** Every change to `app/` must still run in Safari and Chrome and pass `npm test`. Gate iOS-only behaviour on whether the bridge exists (`window.webkit?.messageHandlers?.belts`), never on the user agent.
6. **No new web dependencies, no web build step.** Swift Package dependencies are also not allowed. Use Apple frameworks only.

## Where things go

```
ios/
  SudokuBelts.xcodeproj
  SudokuBelts/            SwiftUI app, WKWebView host, bridge, StoreKit, notifications
  SudokuBelts/Fonts/      Bundled Fraunces + Nunito (both OFL licensed)
  README.md               How to build and run in the simulator
app/js/native.js          The only JS file that talks to the bridge. Falls back to today's web behaviour.
```

- Bundle ID: `com.nishitbhatt.sudokubelts` (confirm with Nishit before the first archive)
- Display name: Sudoku Belts
- Minimum iOS: 17
- iPhone only for v1 (iPad later)

## Phases (stop after each one for review)

### Phase 1: The shell runs offline
- A SwiftUI app with a single full-screen `WKWebView`. Serve `app/` through a `WKURLSchemeHandler` on a custom scheme (e.g. `belts://app/index.html`) so the origin never changes and `localStorage` stays put. Don't use `file://`.
- Today the app pulls Google Fonts from the network. Bundle the fonts and serve them locally. On the web, keep using Google Fonts.
- Service worker: skip it inside the shell. The bundle is already offline.
- Edges: the page already sets `viewport-fit=cover`. Make sure the board and buttons respect the notch and home bar, and that the status bar matches light and dark.
- Turn off pinch zoom, the long-press link preview and text selection on the board. Swipe-back must not leave the app.
- Hash routing (`#/learn`, `#/game` …) must work, including on cold launch.

### Phase 2: Fix what silently breaks on iPhone today
These work in a browser but fail or do nothing in a web view:

| Feature today | Problem in the web view | iOS replacement |
|---|---|---|
| Haptics (`fx.js`, `navigator.vibrate`) | iOS WebKit has no vibrate. Haptics never fire, not even on the web today | Bridge to `UIImpactFeedbackGenerator` / `UINotificationFeedbackGenerator`. Map the existing ms values to light, medium or success |
| "Save backup file" (`download()` with a blob link) | Blob downloads go nowhere in WKWebView | Bridge: hand the JSON to the share sheet (`UIActivityViewController`) so it can be saved to Files |
| "Restore from file" (`<input type=file>`) | Should work, but verify the Files picker opens and the JSON is read | Keep. Fix it only if it breaks |
| Share today's result (`navigator.share`) | Usually works; verify it | Keep, or use the share sheet via the bridge if it doesn't |
| Calendar reminder (`.ics` download) | Download goes nowhere | Replaced in phase 3. Hide the .ics button inside the shell |
| Sound (`AudioContext`) | Must respect the silent switch and not stop music | Set the audio session to `.ambient` |

### Phase 3: Daily reminder with no server
- In the shell, Me → reminder uses local notifications (`UNUserNotificationCenter`): ask permission only when the player turns the reminder on, then repeat daily at `S.settings.remindAt`.
- Tapping the notification opens `#/daily`.
- If they've already practised today, skip today's notification. Reschedule on every app open: today's slot plus the next 6 days, no more than one per day.
- Copy stays warm and never guilt-trips (see `research/habit-research.md`). Example: "Today's puzzle is ready. Five minutes?"
- This also clears the TASKS.md item "Real push reminders (needs a backend)" for iPhone.

### Phase 4: App Store ready
v1 is **completely free**: no purchases, no locks, no StoreKit. The paid unlock is a later task on `TASKS.md`. Don't build anything for it now.

- App icon from `app/icons/`, launch screen in the app's background colour (no white flash in dark mode)
- Privacy manifest (`PrivacyInfo.xcprivacy`): no tracking, data not collected; declare the `UserDefaults` reason if used
- Six phone-size screenshots in light mode: a lesson, a hint, the coach, a belt ceremony, the daily puzzle, Me
- **Don't upload, archive for TestFlight or submit anything.** Nishit does that.

## Done means (Claude checks each one in the simulator)

| Check | How |
|---|---|
| `npm test` and `npm run bank` pass | Run both |
| Works in airplane mode from a cold start | Simulator network off, then launch |
| A save from before an app update is still there | Install, play, rebuild, reinstall, check XP and streak |
| Web app unchanged | Serve `app/` on localhost and check it at 390×844, light and dark |
| Haptics, backup, restore, share, sound all work | Tap through Me and a full game |
| Reminder fires and opens the daily puzzle | Set the reminder 1 minute ahead in the simulator |
| Light and dark, notch and home bar | iPhone 16 / 17 simulator screenshots |

## Not in v1
Paid unlock, iPad layout, widgets, Game Center, iCloud sync, Android, any server.

Setup checked 2026-11-04: Xcode 27.0 is selected, and the iOS 26.5 and 27.0 simulators are installed.
