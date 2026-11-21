import Foundation
import NaturalLanguage
import Translation

struct HostRequest: Decodable {
    let id: String
    let action: String
    let texts: [String]?
    let sourceLang: String?
    let targetLang: String?
    let pageLang: String?
}

struct LanguagePackItem: Encodable {
    let code: String
    let name: String
    let status: String // "installed" | "supported" | "unsupported"
}

struct HostResponse: Encodable {
    let id: String
    let ok: Bool
    var translations: [String]?
    var detectedSource: String?
    var fallback: Bool?
    var reason: String?
    var sourceLang: String?
    var targetLang: String?
    var supportedLanguages: [String]?
    var languagePacks: [LanguagePackItem]?
    var error: String?
}

func normalizeLanguageCode(_ raw: String?) -> String? {
    guard let raw = raw?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty else {
        return nil
    }
    let lower = raw.lowercased()
    switch lower {
    case "zh-cn", "zh-hans", "zh-sg":
        return "zh"
    case "zh-tw", "zh-hant", "zh-hk", "zh-mo":
        return "zh-TW"
    case "ar", "ar-sa", "ar-eg":
        return "ar-AE"
    case "en-us":
        return "en"
    case "en-gb":
        return "en-GB"
    case "pt-br", "pt-pt":
        return "pt"
    default:
        // Strip region subtag if not one of Apple's explicit regional identifiers
        if let dash = lower.firstIndex(of: "-") {
            let base = String(lower[..<dash])
            if base == "zh" { return "zh" }
            if base == "ar" { return "ar-AE" }
            return base
        }
        return lower
    }
}

func baseLanguage(_ code: String) -> String {
    let lower = code.lowercased()
    if let dash = lower.firstIndex(of: "-") {
        return String(lower[..<dash])
    }
    return lower
}

func detectDominantLanguage(for text: String) -> (code: String, confidence: Double)? {
    let recognizer = NLLanguageRecognizer()
    recognizer.processString(text)
    let hypotheses = recognizer.languageHypotheses(withMaximum: 1)
    guard let (lang, confidence) = hypotheses.first, lang != .undetermined else {
        return nil
    }
    return (normalizeLanguageCode(lang.rawValue) ?? lang.rawValue, confidence)
}

actor TranslatorEngine {
    private let availability = LanguageAvailability()
    private var sessions: [String: TranslationSession] = [:]

    func getSupportedLanguages() async -> [String] {
        let langs = await availability.supportedLanguages
        return langs.map { $0.minimalIdentifier }.sorted()
    }

    func getLanguageStatuses(targetCode: String) async -> [LanguagePackItem] {
        let normalizedTarget = normalizeLanguageCode(targetCode) ?? "tr"
        let targetLang = Locale.Language(identifier: normalizedTarget)
        let langs = await availability.supportedLanguages
        let trLocale = Locale(identifier: "tr")

        var items: [LanguagePackItem] = []
        for lang in langs {
            let code = lang.minimalIdentifier
            if baseLanguage(code) == baseLanguage(normalizedTarget) {
                if !(normalizedTarget == "zh-TW" && code == "zh") && !(normalizedTarget == "zh" && code == "zh-TW") {
                    continue
                }
            }
            let status = await availability.status(from: lang, to: targetLang)
            let statusStr: String
            switch status {
            case .installed:
                statusStr = "installed"
            case .supported:
                statusStr = "supported"
            case .unsupported:
                statusStr = "unsupported"
            @unknown default:
                statusStr = "unsupported"
            }
            if statusStr == "unsupported" { continue }
            let rawName = trLocale.localizedString(forIdentifier: code) ?? code
            let displayName = rawName.prefix(1).uppercased(with: trLocale) + rawName.dropFirst()
            items.append(LanguagePackItem(code: code, name: displayName, status: statusStr))
        }

        items.sort { a, b in
            if a.status != b.status {
                return a.status == "installed"
            }
            return a.name.localizedCompare(b.name) == .orderedAscending
        }
        return items
    }

    func translateBatch(texts: [String], targetCode: String, pageLangHint: String?) async -> (
        translations: [String]?,
        detectedSource: String?,
        fallback: Bool,
        reason: String?,
        sourceLang: String?
    ) {
        if texts.isEmpty {
            return ([], nil, false, nil, nil)
        }

        let normalizedTarget = normalizeLanguageCode(targetCode) ?? "tr"
        let targetLang = Locale.Language(identifier: normalizedTarget)

        // Detect batch dominant language from combined sample
        let sample = texts.prefix(20).joined(separator: " ")
        let batchDetected = detectDominantLanguage(for: sample)?.code
        let hintNormalized = normalizeLanguageCode(pageLangHint)
        let defaultSource = batchDetected ?? hintNormalized

        // Assign a source language per text index
        var indicesBySource: [String: [Int]] = [:]
        var output = texts

        for (idx, text) in texts.enumerated() {
            var src = defaultSource
            if text.count >= 30, let individual = detectDominantLanguage(for: text), individual.confidence >= 0.72 {
                src = individual.code
            }
            guard let resolvedSrc = src else {
                return (nil, nil, true, "UNDETERMINED_LANGUAGE", nil)
            }
            // Already in target language -> keep original
            if baseLanguage(resolvedSrc) == baseLanguage(normalizedTarget) {
                if !(normalizedTarget == "zh-TW" && resolvedSrc == "zh") {
                    continue
                }
            }
            indicesBySource[resolvedSrc, default: []].append(idx)
        }

        if indicesBySource.isEmpty {
            return (output, defaultSource, false, nil, defaultSource)
        }

        for (srcCode, indices) in indicesBySource {
            let srcLang = Locale.Language(identifier: srcCode)
            let status = await availability.status(from: srcLang, to: targetLang)

            switch status {
            case .installed:
                let sessionKey = "\(srcCode)->\(normalizedTarget)"
                let session: TranslationSession
                if let cached = sessions[sessionKey] {
                    session = cached
                } else {
                    session = TranslationSession(installedSource: srcLang, target: targetLang)
                    sessions[sessionKey] = session
                }

                let requests = indices.enumerated().map { (offset, textIdx) in
                    TranslationSession.Request(sourceText: texts[textIdx], clientIdentifier: "\(offset)")
                }

                do {
                    let responses = try await session.translations(from: requests)
                    for response in responses {
                        if let idStr = response.clientIdentifier,
                           let offset = Int(idStr),
                           offset >= 0 && offset < indices.count {
                            output[indices[offset]] = response.targetText
                        }
                    }
                } catch {
                    return (nil, srcCode, true, "TRANSLATION_FAILED: \(error.localizedDescription)", srcCode)
                }

            case .supported:
                return (nil, srcCode, true, "NOT_INSTALLED", srcCode)

            case .unsupported:
                return (nil, srcCode, true, "UNSUPPORTED", srcCode)

            @unknown default:
                return (nil, srcCode, true, "UNKNOWN_STATUS", srcCode)
            }
        }

        return (output, defaultSource, false, nil, defaultSource)
    }
}

func readExact(_ fd: Int32, count: Int) -> Data? {
    var buffer = [UInt8](repeating: 0, count: count)
    var totalRead = 0
    while totalRead < count {
        let bytesRead = buffer.withUnsafeMutableBytes { ptr -> Int in
            guard let base = ptr.baseAddress else { return -1 }
            return Darwin.read(fd, base.advanced(by: totalRead), count - totalRead)
        }
        if bytesRead <= 0 {
            return nil
        }
        totalRead += bytesRead
    }
    return Data(buffer)
}

func writeExact(_ fd: Int32, data: Data) -> Bool {
    var totalWritten = 0
    let count = data.count
    while totalWritten < count {
        let written = data.withUnsafeBytes { ptr -> Int in
            guard let base = ptr.baseAddress else { return -1 }
            return Darwin.write(fd, base.advanced(by: totalWritten), count - totalWritten)
        }
        if written <= 0 {
            return false
        }
        totalWritten += written
    }
    return true
}

func readNativeMessage() -> Data? {
    guard let header = readExact(STDIN_FILENO, count: 4) else {
        return nil
    }
    let length = header.withUnsafeBytes { $0.load(as: UInt32.self).littleEndian }
    if length == 0 || length > 16 * 1024 * 1024 {
        return nil
    }
    return readExact(STDIN_FILENO, count: Int(length))
}

func sendNativeResponse(_ response: HostResponse) {
    let encoder = JSONEncoder()
    guard let jsonData = try? encoder.encode(response) else { return }
    var len = UInt32(jsonData.count).littleEndian
    let headerData = Data(bytes: &len, count: 4)
    _ = writeExact(STDOUT_FILENO, data: headerData)
    _ = writeExact(STDOUT_FILENO, data: jsonData)
}

@main
struct AppleTranslatorHost {
    static func main() async {
        let engine = TranslatorEngine()
        let decoder = JSONDecoder()

        while let payload = readNativeMessage() {
            guard let req = try? decoder.decode(HostRequest.self, from: payload) else {
                continue
            }

            if req.action == "ping" {
                let langs = await engine.getSupportedLanguages()
                sendNativeResponse(HostResponse(
                    id: req.id,
                    ok: true,
                    supportedLanguages: langs
                ))
                continue
            }

            if req.action == "languageStatus" {
                let targetLang = req.targetLang ?? "tr"
                let packs = await engine.getLanguageStatuses(targetCode: targetLang)
                sendNativeResponse(HostResponse(
                    id: req.id,
                    ok: true,
                    targetLang: normalizeLanguageCode(targetLang) ?? targetLang,
                    languagePacks: packs
                ))
                continue
            }

            if req.action == "downloadLanguage" {
                let source = normalizeLanguageCode(req.sourceLang) ?? "en"
                let target = normalizeLanguageCode(req.targetLang) ?? "tr"
                let execDir = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent()
                let appURL = execDir.appendingPathComponent("AppleLanguageDownloader.app")

                let process = Process()
                process.executableURL = URL(fileURLWithPath: "/usr/bin/open")
                process.arguments = ["-n", appURL.path, "--args", source, target]
                do {
                    try process.run()
                    sendNativeResponse(HostResponse(
                        id: req.id,
                        ok: true,
                        sourceLang: source,
                        targetLang: target
                    ))
                } catch {
                    sendNativeResponse(HostResponse(
                        id: req.id,
                        ok: false,
                        error: "İndirici başlatılamadı: \(error.localizedDescription)"
                    ))
                }
                continue
            }

            if req.action == "openSystemSettings" {
                let process = Process()
                process.executableURL = URL(fileURLWithPath: "/usr/bin/open")
                process.arguments = ["x-apple.systempreferences:com.apple.Localization-Settings.extension"]
                do {
                    try process.run()
                    sendNativeResponse(HostResponse(id: req.id, ok: true))
                } catch {
                    sendNativeResponse(HostResponse(id: req.id, ok: false, error: error.localizedDescription))
                }
                continue
            }

            if req.action == "translate" {
                let texts = req.texts ?? []
                let targetLang = req.targetLang ?? "tr"
                let result = await engine.translateBatch(
                    texts: texts,
                    targetCode: targetLang,
                    pageLangHint: req.pageLang
                )
                if let translated = result.translations {
                    sendNativeResponse(HostResponse(
                        id: req.id,
                        ok: true,
                        translations: translated,
                        detectedSource: result.detectedSource,
                        fallback: false
                    ))
                } else {
                    sendNativeResponse(HostResponse(
                        id: req.id,
                        ok: false,
                        fallback: result.fallback,
                        reason: result.reason,
                        sourceLang: result.sourceLang,
                        targetLang: normalizeLanguageCode(targetLang) ?? targetLang
                    ))
                }
                continue
            }

            sendNativeResponse(HostResponse(
                id: req.id,
                ok: false,
                error: "Unknown action: \(req.action)"
            ))
        }
    }
}
