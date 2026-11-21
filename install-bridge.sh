#!/usr/bin/env bash
set -euo pipefail

REPO_RAW="https://raw.githubusercontent.com/imhalid/aninda-ceviri/main"
EXTENSION_ID="dimgcaflkglcjgplekclkclpchkcapgh"
HOST_NAME="com.halit.apple_translator"
INSTALL_DIR="$HOME/Library/Application Support/AnindaCeviri"
APP_BUNDLE="$INSTALL_DIR/AppleLanguageDownloader.app"

echo ""
echo "Anında Çeviri — Apple Yerel Köprü Kurulumu"
echo "=========================================="

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Hata: Bu köprü yalnızca macOS bilgisayarlarda çalışır."
  exit 1
fi

MAC_VER="$(sw_vers -productVersion)"
MAC_MAJOR="${MAC_VER%%.*}"
if [[ "$MAC_MAJOR" -lt 15 ]]; then
  echo "Hata: Apple Translation API için macOS 15+ gerekir (Mevcut: $MAC_VER)."
  exit 1
fi

if ! command -v swiftc >/dev/null 2>&1; then
  echo "Swift derleyicisi bulunamadı. Lütfen Command Line Tools kurun:"
  echo "  xcode-select --install"
  exit 1
fi

mkdir -p "$INSTALL_DIR" "$APP_BUNDLE/Contents/MacOS"

SCRIPT_DIR=""
if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]}" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

if [[ -n "$SCRIPT_DIR" && -f "$SCRIPT_DIR/native-host/main.swift" && -f "$SCRIPT_DIR/native-host/downloader.swift" ]]; then
  echo "[1/4] Yerel kaynak dosyalar kopyalanıyor..."
  cp "$SCRIPT_DIR/native-host/main.swift" "$INSTALL_DIR/main.swift"
  cp "$SCRIPT_DIR/native-host/downloader.swift" "$INSTALL_DIR/downloader.swift"
  cp "$SCRIPT_DIR/native-host/AppleLanguageDownloader.app/Contents/Info.plist" "$APP_BUNDLE/Contents/Info.plist"
else
  echo "[1/4] Kaynak dosyalar GitHub üzerinden indiriliyor..."
  curl -fsSL "$REPO_RAW/native-host/main.swift" -o "$INSTALL_DIR/main.swift"
  curl -fsSL "$REPO_RAW/native-host/downloader.swift" -o "$INSTALL_DIR/downloader.swift"
  curl -fsSL "$REPO_RAW/native-host/AppleLanguageDownloader.app/Contents/Info.plist" -o "$APP_BUNDLE/Contents/Info.plist"
fi

echo "[2/4] Apple Translation köprüsü derleniyor..."
swiftc -O -parse-as-library "$INSTALL_DIR/main.swift" -o "$INSTALL_DIR/apple-translator"

echo "[3/4] Apple Dil İndirici derleniyor..."
swiftc -O -parse-as-library "$INSTALL_DIR/downloader.swift" -o "$APP_BUNDLE/Contents/MacOS/AppleLanguageDownloader"

echo "[4/4] Tarayıcı Native Messaging kayıtları oluşturuluyor..."
HOST_JSON="{
  \"name\": \"$HOST_NAME\",
  \"description\": \"Apple macOS Local Translation Host for Chrome\",
  \"path\": \"$INSTALL_DIR/apple-translator\",
  \"type\": \"stdio\",
  \"allowed_origins\": [
    \"chrome-extension://$EXTENSION_ID/\"
  ]
}"

BROWSERS=(
  "$HOME/Library/Application Support/Google/Chrome"
  "$HOME/Library/Application Support/Arc/User Data"
  "$HOME/Library/Application Support/BraveSoftware/Brave-Browser"
  "$HOME/Library/Application Support/Chromium"
  "$HOME/Library/Application Support/Microsoft Edge"
  "$HOME/Library/Application Support/Vivaldi"
)

for base in "${BROWSERS[@]}"; do
  if [[ -d "$base" || "$base" == *"Google/Chrome"* ]]; then
    mkdir -p "$base/NativeMessagingHosts"
    printf '%s\n' "$HOST_JSON" > "$base/NativeMessagingHosts/$HOST_NAME.json"
    echo "  ✓ Kaydedildi: $base/NativeMessagingHosts/$HOST_NAME.json"
  fi
done

# Self-test via Python RPC
python3 - << EOF
import subprocess, struct, json
p = subprocess.Popen(
    ["$INSTALL_DIR/apple-translator"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)
raw = json.dumps({"id": "ping", "action": "ping"}).encode("utf-8")
p.stdin.write(struct.pack("<I", len(raw)) + raw)
p.stdin.flush()
hdr = p.stdout.read(4)
length = struct.unpack("<I", hdr)[0]
resp = json.loads(p.stdout.read(length).decode("utf-8"))
p.stdin.close()
p.wait()
assert resp.get("ok") is True, f"Ping başarısız: {resp}"
print(f"  ✓ Doğrulama başarılı ({len(resp.get('supportedLanguages', []))} Apple dili destekleniyor)")
EOF

echo ""
echo "Kurulum tamamlandı! Eklenti Ayarlar sekmesinden 'Bağlantıyı Kontrol Et' diyebilirsiniz."
echo ""
