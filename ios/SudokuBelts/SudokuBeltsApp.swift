import SwiftUI

@main
struct SudokuBeltsApp: App {
    var body: some Scene {
        WindowGroup {
            BeltsWebView()
                .ignoresSafeArea()
        }
    }
}
