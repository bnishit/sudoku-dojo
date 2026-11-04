import SwiftUI
import WebKit
import UIKit

struct BeltsWebView: UIViewRepresentable {
    func makeCoordinator() -> Navigation { Navigation() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        // Keep both the origin and data store stable across app updates.
        configuration.websiteDataStore = .default()
        configuration.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: "belts")
        configuration.userContentController.add(context.coordinator, name: "belts")
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
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
        webView.load(URLRequest(url: URL(string: "belts://app/index.html#/learn")!))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Navigation) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "belts")
    }

    final class Navigation: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        func userContentController(_ userContentController: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            guard message.name == "belts", message.frameInfo.isMainFrame,
                  let url = message.frameInfo.request.url,
                  url.scheme == "belts", url.host == "app",
                  let body = message.body as? [String: Any],
                  let name = body["name"] as? String else { return }
            switch name {
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
