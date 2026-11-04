import SwiftUI
import AVFAudio
import WebKit
import UserNotifications

@main
struct SudokuBeltsApp: App {
    @UIApplicationDelegateAdaptor(ReminderNotifications.self) private var reminders
    @Environment(\.scenePhase) private var scenePhase

    init() {
        try? AVAudioSession.sharedInstance().setCategory(.ambient)
    }

    var body: some Scene {
        WindowGroup {
            BeltsWebView(reminders: reminders)
                .ignoresSafeArea()
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active { reminders.refresh() }
                }
        }
    }
}

@MainActor
final class ReminderNotifications: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    weak var webView: WKWebView?
    var ready = false
    private var dailyRequested = false
    private var revision = 0
    private var permissionRequested = false
    private var permission: Task<Bool, Never>?
    private var scheduling: Task<Void, Never>?
    private let center = UNUserNotificationCenter.current()

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        center.delegate = self
        return true
    }

    func refresh() {
        guard ready else { return } // Cold launch sends its own reminder message from JS boot.
        webView?.evaluateJavaScript("window.dispatchEvent(new Event('belts-open'))", completionHandler: nil)
    }

    func update(_ body: [String: Any]) {
        guard let on = body["on"] as? Bool, let time = body["time"] as? String,
              time.range(of: #"^([01][0-9]|2[0-3]):[0-5][0-9]$"#, options: .regularExpression) != nil,
              let practised = body["practisedToday"] as? Bool else { return }
        let parts = time.split(separator: ":").compactMap { Int($0) }
        revision += 1
        let current = revision
        if !on { permissionRequested = false }
        else if body["requestPermission"] as? Bool == true { permissionRequested = true }
        center.removeAllPendingNotificationRequests()
        Task { @MainActor in
            var status = await center.notificationSettings().authorizationStatus
            guard current == revision else { return }
            if on && status == .notDetermined {
                if permission == nil && permissionRequested {
                    permission = Task { (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false }
                }
                if let permission {
                    _ = await permission.value
                    status = await center.notificationSettings().authorizationStatus
                }
            }
            guard current == revision else { return } // An off tap or newer time wins over any pending work.
            if status != .notDetermined { permission = nil }
            permissionRequested = false
            let allowed = status == .authorized || status == .provisional || status == .ephemeral
            let enabled = on && allowed
            webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('belts-reminder-status', {detail: {on: \(enabled), denied: \(status == .denied)}}))", completionHandler: nil)
            let previous = scheduling
            scheduling = Task { @MainActor in
                // Finish any in-flight add before clearing it, so a quick off tap cannot leave a stray reminder.
                await previous?.value
                guard current == revision else { return }
                center.removeAllPendingNotificationRequests()
                guard enabled else { return }
                let calendar = Calendar.current, now = Date()
                let start = calendar.startOfDay(for: now)
                for offset in 0..<7 {
                    guard current == revision else { return }
                    guard !(offset == 0 && practised),
                          let day = calendar.date(byAdding: .day, value: offset, to: start),
                          let date = calendar.date(bySettingHour: parts[0], minute: parts[1], second: 0, of: day),
                          date > now else { continue }
                    let content = UNMutableNotificationContent()
                    content.title = "Sudoku Belts"
                    content.body = "Today's puzzle is ready. Five minutes?"
                    content.sound = .default
                    let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)
                    let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
                    let request = UNNotificationRequest(identifier: "daily-\(offset)", content: content, trigger: trigger)
                    try? await center.add(request)
                }
            }
        }
    }

    func openDailyIfNeeded() {
        guard dailyRequested, ready else { return }
        dailyRequested = false
        webView?.evaluateJavaScript("location.href = 'belts://app/index.html#/daily'", completionHandler: nil)
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                           didReceive response: UNNotificationResponse) async {
        guard response.actionIdentifier == UNNotificationDefaultActionIdentifier else { return }
        await MainActor.run {
            self.dailyRequested = true
            self.openDailyIfNeeded()
        }
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                           willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .list, .sound]
    }
}
