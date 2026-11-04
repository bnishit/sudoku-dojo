import Foundation
import WebKit

final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        do {
            guard let url = urlSchemeTask.request.url,
                  url.scheme == "belts", url.host == "app",
                  urlSchemeTask.request.httpMethod == "GET",
                  let root = Bundle.main.url(forResource: "app", withExtension: nil) else {
                throw URLError(.badURL)
            }
            let rootPath = root.resolvingSymlinksInPath().path
            let path = url.path == "/" ? "index.html" : String(url.path.dropFirst())
            let file = root.appendingPathComponent(path).standardizedFileURL.resolvingSymlinksInPath()
            guard file.path.hasPrefix(rootPath + "/") else { throw URLError(.noPermissionsToReadFile) }
            var data = try Data(contentsOf: file)
            if path == "index.html" {
                data = Data(shellHTML(String(decoding: data, as: UTF8.self)).utf8)
            }
            let mime = ["html": "text/html", "css": "text/css", "js": "application/javascript",
                        "json": "application/json", "webmanifest": "application/manifest+json",
                        "svg": "image/svg+xml", "png": "image/png"][file.pathExtension] ?? "application/octet-stream"
            let response = URLResponse(url: url, mimeType: mime, expectedContentLength: data.count,
                                       textEncodingName: ["html", "css", "js", "json", "webmanifest", "svg"].contains(file.pathExtension) ? "utf-8" : nil)
            // Reads and callbacks finish synchronously; no pending work remains for stop().
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func shellHTML(_ html: String) -> String {
        // Transform only the bundled response. The shared web source keeps Google Fonts.
        let local = html.replacingOccurrences(of: #"<link\b[^>]*https://fonts\.(googleapis|gstatic)\.com[^>]*>"#,
                                              with: "", options: .regularExpression)
        let policy = """
        <meta http-equiv="Content-Security-Policy" content="default-src belts: data: blob:; script-src belts:; style-src belts: 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'">
        """
        let style = """
        <style>
        :root { --font: ui-rounded, system-ui, -apple-system, sans-serif; --display: ui-serif, Georgia, serif; }
        .board, .board * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
        html { touch-action: manipulation; }
        </style>
        """
        return local.replacingOccurrences(of: "<head>", with: "<head>\n" + policy)
            .replacingOccurrences(of: "viewport-fit=cover", with: "viewport-fit=cover, maximum-scale=1, user-scalable=no")
            .replacingOccurrences(of: "</head>", with: style + "\n</head>")
    }
}
