import SwiftUI
import AVFAudio

@main
struct SudokuBeltsApp: App {
    init() {
        try? AVAudioSession.sharedInstance().setCategory(.ambient)
    }

    var body: some Scene {
        WindowGroup {
            BeltsWebView()
                .ignoresSafeArea()
        }
    }
}
