import SwiftUI
import WebKit

struct BeltsWebView: UIViewRepresentable {
    func makeCoordinator() -> Navigation { Navigation() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        // Keep both the origin and data store stable across app updates.
        configuration.websiteDataStore = .default()
        configuration.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: "belts")
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

    final class Navigation: NSObject, WKNavigationDelegate {
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            let url = navigationAction.request.url
            let internalPage = url?.scheme == "belts" && url?.host == "app"
            decisionHandler(internalPage && navigationAction.targetFrame?.isMainFrame == true ? .allow : .cancel)
        }
    }
}
