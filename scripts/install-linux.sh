#!/usr/bin/env bash
set -e

APP_NAME="doit"
DISPLAY_NAME="Doit"
GITHUB_REPO="Surya-T-S/Doit"
VERSION="1.0.1"

echo "=================================================="
echo "  Installing $DISPLAY_NAME v$VERSION for Linux..."
echo "=================================================="

# Standard XDG desktop paths
INSTALL_DIR="$HOME/.local/share/doit"
BIN_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"

mkdir -p "$INSTALL_DIR" "$BIN_DIR" "$DESKTOP_DIR" "$ICON_DIR"

APPIMAGE_URL="https://github.com/$GITHUB_REPO/releases/download/v$VERSION/Doit-linux-$VERSION.AppImage"
ICON_URL="https://raw.githubusercontent.com/$GITHUB_REPO/main/public/logo.png"

echo "--> Downloading application..."
curl -fsSL -o "$INSTALL_DIR/Doit.AppImage" "$APPIMAGE_URL"
chmod +x "$INSTALL_DIR/Doit.AppImage"

# Create symlink in ~/.local/bin
ln -sf "$INSTALL_DIR/Doit.AppImage" "$BIN_DIR/$APP_NAME"

echo "--> Downloading application icon..."
curl -fsSL -o "$ICON_DIR/$APP_NAME.png" "$ICON_URL"
# Also keep a local copy inside install dir as fallback
cp "$ICON_DIR/$APP_NAME.png" "$INSTALL_DIR/logo.png"

echo "--> Registering desktop shortcut..."

# Register both StartupWMClass names (Doit and doit) so GNOME/KDE/Wayland match the window 100%
cat <<EOF > "$DESKTOP_DIR/$APP_NAME.desktop"
[Desktop Entry]
Name=$DISPLAY_NAME
GenericName=Personal Planner
Comment=Minimal, distraction-free personal planning desktop application
Exec=$INSTALL_DIR/Doit.AppImage %U
Icon=$APP_NAME
Terminal=false
Type=Application
StartupWMClass=Doit
Categories=Utility;Office;
Keywords=task;planner;calendar;todo;minimal;
X-AppImage-Version=$VERSION
EOF

# Provide doit.desktop as an alias symlink for window managers matching lowercase
ln -sf "$DESKTOP_DIR/$APP_NAME.desktop" "$DESKTOP_DIR/Doit.desktop"

chmod +x "$DESKTOP_DIR/$APP_NAME.desktop"

# Ensure GNOME / KDE / XFCE refresh desktop & icon caches immediately
echo "--> Updating desktop icon cache..."
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


