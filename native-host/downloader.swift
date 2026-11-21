import AppKit
import SwiftUI
import Translation

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }
}

struct DownloaderView: View {
    let sourceCode: String
    let targetCode: String

    @State private var config: TranslationSession.Configuration?
    @State private var statusText: String = "Apple çeviri dil paketi hazırlanıyor…"
    @State private var isDone: Bool = false
    @State private var hasError: Bool = false

    private var pairLabel: String {
        let tr = Locale(identifier: "tr")
        let sName = tr.localizedString(forIdentifier: sourceCode) ?? sourceCode.uppercased()
        let tName = tr.localizedString(forIdentifier: targetCode) ?? targetCode.uppercased()
        return "\(sName) → \(tName)"
    }

    var body: some View {
        VStack(spacing: 14) {
            VStack(spacing: 4) {
                Text("Apple Çevrimdışı Dil Paketi")
                    .font(.system(size: 13.5, weight: .semibold))
                Text(pairLabel)
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 8) {
                if !isDone && !hasError {
                    ProgressView()
                        .controlSize(.small)
                }
                Text(statusText)
                    .font(.system(size: 12))
                    .foregroundStyle(hasError ? .red : .secondary)
                    .multilineTextAlignment(.center)
            }

            HStack(spacing: 8) {
                Button("Sistem Ayarları") {
                    if let url = URL(string: "x-apple.systempreferences:com.apple.Localization-Settings.extension") {
                        NSWorkspace.shared.open(url)
                    }
                }
                .buttonStyle(.bordered)

                Button(isDone ? "Tamam" : "Kapat") {
                    NSApp.terminate(nil)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(18)
        .frame(width: 320, height: 156)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                NSApp.activate(ignoringOtherApps: true)
                config = TranslationSession.Configuration(
                    source: Locale.Language(identifier: sourceCode),
                    target: Locale.Language(identifier: targetCode)
                )
            }
        }
        .translationTask(config) { session in
            do {
                try await session.prepareTranslation()
                await MainActor.run {
                    statusText = "Dil paketi kullanıma hazır ✓"
                    isDone = true
                }
                try? await Task.sleep(nanoseconds: 1_200_000_000)
                await MainActor.run {
                    NSApp.terminate(nil)
                }
            } catch {
                await MainActor.run {
                    hasError = true
                    statusText = "Sistem onayı tamamlanmadı veya iptal edildi."
                }
            }
        }
    }
}

@main
struct AppleLanguageDownloaderApp {
    static func main() {
        let args = CommandLine.arguments
        let sourceCode = args.count > 1 ? args[1] : "de"
        let targetCode = args.count > 2 ? args[2] : "tr"

        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.delegate = delegate

        let hosting = NSHostingController(
            rootView: DownloaderView(sourceCode: sourceCode, targetCode: targetCode)
        )
        let window = NSWindow(contentViewController: hosting)
        window.title = "Apple Dil İndirici"
        window.styleMask = [.titled, .closable]
        window.isReleasedWhenClosed = false
        window.center()
        window.makeKeyAndOrderFront(nil)

        app.run()
    }
}
