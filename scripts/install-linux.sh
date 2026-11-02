#!/usr/bin/env bash
set -e

APP_NAME="doit"
DISPLAY_NAME="Doit"
GITHUB_REPO="Surya-T-S/Doit"
VERSION="1.0.1"

echo "=================================================="
echo "  Installing $DISPLAY_NAME v$VERSION for Linux..."
echo "=================================================="

# Directories
BIN_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"

mkdir -p "$BIN_DIR" "$DESKTOP_DIR" "$ICON_DIR"

APPIMAGE_URL="https://github.com/$GITHUB_REPO/releases/download/v$VERSION/Doit-linux-$VERSION.AppImage"
ICON_URL="https://raw.githubusercontent.com/$GITHUB_REPO/main/public/logo.png"

echo "--> Downloading application..."
curl -fsSL -o "$BIN_DIR/$APP_NAME" "$APPIMAGE_URL"
chmod +x "$BIN_DIR/$APP_NAME"

echo "--> Downloading application icon..."
curl -fsSL -o "$ICON_DIR/$APP_NAME.png" "$ICON_URL"

echo "--> Registering desktop shortcut..."
cat <<EOF > "$DESKTOP_DIR/$APP_NAME.desktop"
[Desktop Entry]
Name=$DISPLAY_NAME
Comment=Minimal, distraction-free personal planning desktop application
Exec=$BIN_DIR/$APP_NAME %U
Icon=$ICON_DIR/$APP_NAME.png
Terminal=false
Type=Application
StartupWMClass=doit
Categories=Utility;Office;
Keywords=task;planner;calendar;todo;minimal;
EOF

chmod +x "$DESKTOP_DIR/$APP_NAME.desktop"

# Update desktop icon cache if tools exist
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" >/dev/null 2>&1 || true
fi

echo "=================================================="
echo "  ✓ $DISPLAY_NAME successfully installed!"
echo "  The app and icon are now in your Application Menu."
echo "  You can launch it from your App Launcher or type: doit"
echo "=================================================="

