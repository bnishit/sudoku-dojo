import SwiftUI
import WebKit
import UIKit

struct BeltsWebView: UIViewRepresentable {
    let reminders: ReminderNotifications
    func makeCoordinator() -> Navigation { Navigation(reminders: reminders) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        // Keep both the origin and data store stable across app updates.
        configuration.websiteDataStore = .default()
        configuration.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: "belts")
        configuration.userContentController.add(context.coordinator, name: "belts")
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.allowsLinkPreview = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false
        let background = UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 20/255, green: 21/255, blue: 27/255, alpha: 1)
                : UIColor(red: 245/255, green: 239/255, blue: 227/255, alpha: 1)
        }
        webView.isOpaque = false
        webView.backgroundColor = background
        webView.scrollView.backgroundColor = background
        webView.underPageBackgroundColor = background
        reminders.webView = webView
        reminders.ready = false
        webView.load(URLRequest(url: URL(string: "belts://app/index.html#/learn")!))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Navigation) {
        coordinator.cancelDialog?()
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "belts")
    }

    final class Navigation: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        let reminders: ReminderNotifications
        private(set) var cancelDialog: (() -> Void)?
        init(reminders: ReminderNotifications) { self.reminders = reminders }

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            presentDialog(in: webView, message: message, fallback: (), completion: { _ in completionHandler() }) { alert, finish in
                alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in finish(()) })
            }
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            presentDialog(in: webView, message: message, fallback: false, completion: completionHandler) { alert, finish in
                alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in finish(false) })
                alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in finish(true) })
            }
        }

        func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String,
                     defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (String?) -> Void) {
            presentDialog(in: webView, message: prompt, fallback: Optional<String>.none, completion: completionHandler) { alert, finish in
                alert.addTextField { $0.text = defaultText }
                alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in finish(nil) })
                alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak alert] _ in
                    finish(alert?.textFields?.first?.text ?? "")
                })
            }
        }

        private func presentDialog<Value>(in webView: WKWebView, message: String, fallback: Value,
                                          completion: @escaping (Value) -> Void,
                                          configure: (UIAlertController, @escaping (Value) -> Void) -> Void) {
            guard cancelDialog == nil, var presenter = webView.window?.rootViewController else {
                completion(fallback)
                return
            }
            while true {
                if let presented = presenter.presentedViewController { presenter = presented }
                else if let navigation = presenter as? UINavigationController, let visible = navigation.visibleViewController { presenter = visible }
                else if let tabs = presenter as? UITabBarController, let selected = tabs.selectedViewController { presenter = selected }
                else { break }
            }
            guard presenter.viewIfLoaded?.window != nil,
                  !presenter.isBeingPresented, !presenter.isBeingDismissed,
                  !(presenter is UIAlertController) else {
                completion(fallback)
                return
            }
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            var finished = false
            let finish: (Value) -> Void = { [weak self] value in
                guard !finished else { return }
                finished = true
                self?.cancelDialog = nil
                completion(value)
            }
            cancelDialog = { finish(fallback) }
            configure(alert, finish)
            presenter.present(alert, animated: true)
            // UIKit can refuse presentation without calling a presentation completion.
            DispatchQueue.main.async {
                if alert.presentingViewController == nil { finish(fallback) }
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            reminders.ready = true
            reminders.openDailyIfNeeded()
        }

        func userContentController(_ userContentController: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            guard message.name == "belts", message.frameInfo.isMainFrame,
                  let url = message.frameInfo.request.url,
                  url.scheme == "belts", url.host == "app",
                  let body = message.body as? [String: Any],
                  let name = body["name"] as? String else { return }
            switch name {
            case "reminder":
                reminders.update(body)
            case "haptic":
                guard let ms = body["ms"] as? Double, ms > 0 else { return }
                // Current calls: 12 ms = light, 40 ms = medium. Longer pulses = success.
                if ms >= 80 {
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                } else {
                    UIImpactFeedbackGenerator(style: ms < 30 ? .light : .medium).impactOccurred()
                }
            case "shareFile", "shareText":
                guard let text = body["text"] as? String,
                      let presenter = message.webView?.window?.rootViewController,
                      presenter.presentedViewController == nil else { return }
                var items: [Any] = [text]
                var temporaryDirectory: URL?
                if name == "shareFile" {
                    guard body["type"] as? String == "application/json",
                          let filename = body["filename"] as? String,
                          !filename.isEmpty, !filename.contains("/"),
                          filename.hasSuffix(".json") else { return }
                    let directory = FileManager.default.temporaryDirectory
                        .appendingPathComponent(UUID().uuidString, isDirectory: true)
                    do {
                        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
                        let file = directory.appendingPathComponent(filename)
                        try Data(text.utf8).write(to: file, options: .atomic)
                        temporaryDirectory = directory
                        items = [file]
                    } catch {
                        try? FileManager.default.removeItem(at: directory)
                        return
                    }
                }
                let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
                sheet.completionWithItemsHandler = { _, _, _, _ in
                    if let directory = temporaryDirectory {
                        try? FileManager.default.removeItem(at: directory)
                    }
                }
                sheet.popoverPresentationController?.sourceView = message.webView
                presenter.present(sheet, animated: true)
            default:
                break
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            let url = navigationAction.request.url
            let internalPage = url?.scheme == "belts" && url?.host == "app"
            decisionHandler(internalPage && navigationAction.targetFrame?.isMainFrame == true ? .allow : .cancel)
        }
    }
}
