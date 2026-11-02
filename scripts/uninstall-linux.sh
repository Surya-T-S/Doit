#!/usr/bin/env bash
# Uninstalls Doit installed by install-linux.sh.
# Pass --purge to also delete your personal data (~/.config/Doit).
set -u

XDG_DATA="${XDG_DATA_HOME:-$HOME/.local/share}"

echo "--> Removing Doit..."
rm -rf "$XDG_DATA/doit"
rm -f "$HOME/.local/bin/doit"
rm -f "$XDG_DATA/applications/doit.desktop" "$XDG_DATA/applications/Doit.desktop"
rm -f "$XDG_DATA/icons/hicolor/512x512/apps/doit.png"

if [ "${1:-}" = "--purge" ]; then
    echo "--> Deleting personal data..."
    rm -rf "${XDG_CONFIG_HOME:-$HOME/.config}/Doit" "${XDG_CONFIG_HOME:-$HOME/.config}/doit"
fi

command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$XDG_DATA/applications" >/dev/null 2>&1 || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -f -t "$XDG_DATA/icons/hicolor" >/dev/null 2>&1 || true

echo "✓ Doit has been uninstalled."

