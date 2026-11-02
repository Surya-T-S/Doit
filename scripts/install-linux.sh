#!/usr/bin/env bash
set -euo pipefail

APP_NAME="doit"
DISPLAY_NAME="Doit"
GITHUB_REPO="Surya-T-S/Doit"
VERSION="1.0.1"

echo "=================================================="
echo "  Installing $DISPLAY_NAME v$VERSION for Linux..."
echo "=================================================="

XDG_DATA="${XDG_DATA_HOME:-$HOME/.local/share}"
INSTALL_DIR="$XDG_DATA/doit"
BIN_DIR="$HOME/.local/bin"
DESKTOP_DIR="$XDG_DATA/applications"
ICON_ROOT="$XDG_DATA/icons/hicolor"
ICON_DIR="$ICON_ROOT/512x512/apps"

mkdir -p "$INSTALL_DIR" "$BIN_DIR" "$DESKTOP_DIR" "$ICON_DIR"

APPIMAGE_URL="https://github.com/$GITHUB_REPO/releases/download/v$VERSION/Doit-linux-$VERSION.AppImage"
ICON_URL="https://raw.githubusercontent.com/$GITHUB_REPO/main/public/logo.png"

APPIMAGE="$INSTALL_DIR/Doit.AppImage"
ICON_FILE="$ICON_DIR/$APP_NAME.png"
LAUNCHER="$BIN_DIR/$APP_NAME"

download() { # url dest
    local tmp="$2.part"
    curl -fL --retry 3 --connect-timeout 15 -o "$tmp" "$1"
    mv -f "$tmp" "$2"
}

echo "--> Downloading application..."
download "$APPIMAGE_URL" "$APPIMAGE"
chmod +x "$APPIMAGE"

echo "--> Downloading application icon..."
download "$ICON_URL" "$ICON_FILE"
cp -f "$ICON_FILE" "$INSTALL_DIR/logo.png"

# Launcher wrapper: handles missing FUSE and restricted user namespaces
# (e.g. Ubuntu 24.04) that otherwise make the AppImage fail to start.
# The desktop entry and the "doit" command both go through this wrapper,
# so the launch path never changes between runs.
rm -f "$LAUNCHER"
cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
APPIMAGE="$APPIMAGE"
ARGS=()
if ! command -v fusermount >/dev/null 2>&1 && ! command -v fusermount3 >/dev/null 2>&1; then
    ARGS+=(--appimage-extract-and-run)
fi
if [ -r /proc/sys/kernel/apparmor_restrict_unprivileged_userns ] && \\
   [ "\$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns)" = "1" ]; then
    ARGS+=(--no-sandbox)
fi
exec "\$APPIMAGE" "\${ARGS[@]}" "\$@"
EOF
chmod +x "$LAUNCHER"

echo "--> Registering desktop shortcut..."
# Icon uses an absolute path so it never depends on icon-theme cache state.
# StartupWMClass=doit matches the window class set by the app (X11 WM_CLASS / Wayland app_id).
rm -f "$DESKTOP_DIR/Doit.desktop"
cat > "$DESKTOP_DIR/$APP_NAME.desktop" <<EOF
[Desktop Entry]
Name=$DISPLAY_NAME
GenericName=Personal Planner
Comment=Minimal, distraction-free personal planning desktop application
Exec=$LAUNCHER %U
Icon=$ICON_FILE
Terminal=false
Type=Application
StartupWMClass=doit
StartupNotify=true
Categories=Utility;Office;
Keywords=task;planner;calendar;todo;minimal;
X-AppImage-Version=$VERSION
EOF
chmod +x "$DESKTOP_DIR/$APP_NAME.desktop"

echo "--> Updating desktop & icon caches..."
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -f -t "$ICON_ROOT" >/dev/null 2>&1 || true
command -v kbuildsycoca6 >/dev/null 2>&1 && kbuildsycoca6 >/dev/null 2>&1 || true
command -v kbuildsycoca5 >/dev/null 2>&1 && kbuildsycoca5 >/dev/null 2>&1 || true

case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *) echo "NOTE: add $BIN_DIR to your PATH to run 'doit' from a terminal." ;;
esac

echo "=================================================="
echo "  ✓ $DISPLAY_NAME successfully installed!"
echo "  Launch it from your App Launcher or type: doit"
echo "=================================================="
