<div align="center">

<img src="public/banner.png" alt="Doit Banner" width="100%" />

**Less planning noise. More execution.**

An offline-first, distraction-free desktop personal planner built for focus.

[![Release](https://img.shields.io/github/v/release/Surya-T-S/Doit?color=black&style=flat-square)](https://github.com/Surya-T-S/Doit/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-black?style=flat-square)](#download)
[![License](https://img.shields.io/badge/license-MIT-black?style=flat-square)](LICENSE)

</div>

---

### Why Doit?

*  **Calendar & Week** — Unified time-blocking and capacity planning in a single glance.
*  **Clean Palette** — Minimalist design with customizable accent themes.
*  **100% Private & Local** — Zero tracking, zero external accounts. Your data never leaves your disk.
*  **Keyboard First** — Fast navigation and command palette (`Ctrl + K` / `Cmd + K`).
*  **Import & Export (JSON & CSV)** — Full ownership of your data with instant backup and restore.
*  **Very Fast** — Instant startup, responsive interactions, and zero cloud latency.

---

### Download & Installation

Grab the latest version for your platform from [**GitHub Releases**](https://github.com/Surya-T-S/Doit/releases/latest).

> [!IMPORTANT]
> **Mandatory Setup**: Create a dedicated folder specifically for **Doit** (e.g. `C:\Doit` or `~/Doit`) and move your installer/executable there before running. Do not run directly from your general Downloads folder.

####  Windows
1. Download `Doit-Setup-1.0.1.exe` into your dedicated Doit folder.
2. Double-click the `.exe` and follow the setup wizard.
3. Launch Doit from your Desktop or Start Menu.

####  macOS
1. Download `Doit-mac-1.0.1.dmg`.
2. Open the `.dmg` file.
3. Drag **Doit** into your `Applications` folder (or your dedicated Doit folder).
4. Launch Doit from Spotlight or Launchpad.

####  Linux

**One-Line Quick Install** (Recommended — automatically sets up the app and desktop icon):
```bash
curl -fsSL https://raw.githubusercontent.com/Surya-T-S/Doit/main/scripts/install-linux.sh | bash
```
*Installs Doit, registers the logo, and adds the launcher to your Application Menu, GNOME Dash, and Dock on any Linux distribution (Ubuntu, Fedora, Mint, Arch, etc.) with zero root/sudo required.*

What the script does:
- Downloads the AppImage to `~/.local/share/doit/`
- Creates a `doit` command in `~/.local/bin/` (make sure it is on your `PATH`)
- Adds `doit.desktop` to `~/.local/share/applications/` and the icon to `~/.local/share/icons/`

Launch it from your App Launcher, or run `doit` in a terminal. To update, simply run the install command again.

**Manual alternative:** download `Doit-linux-1.0.1.AppImage` from Releases, then `chmod +x Doit-linux-1.0.1.AppImage && ./Doit-linux-1.0.1.AppImage`. A `.deb` package (`sudo apt install ./Doit-linux-1.0.1.deb`) is also available.

---

### Uninstall

Your data is stored separately from the app, so uninstalling keeps it unless you choose to delete it.

| OS | Data location |
|----|---------------|
| Windows | `%APPDATA%\Doit` |
| macOS | `~/Library/Application Support/Doit` |
| Linux | `~/.config/Doit` |

> [!TIP]
> Want to keep your tasks? Export a JSON/CSV backup from Settings before uninstalling.

#### Windows
1. Open the folder where you installed Doit (the dedicated Doit folder) and double-click **`Uninstall Doit.exe`**.
   *(Alternatively: Settings → Apps → Installed apps → Doit → Uninstall.)*
2. When asked *"Do you also want to completely delete all personal data?"*, choose **Yes** for a full wipe or **No** to keep your data.

#### macOS
1. Quit Doit, then drag **Doit** from `Applications` to the Trash.
2. (Optional, deletes data) `rm -rf ~/Library/Application\ Support/Doit`

#### Linux
Installed with the quick-install script:
```bash
curl -fsSL https://raw.githubusercontent.com/Surya-T-S/Doit/main/scripts/uninstall-linux.sh | bash
```
To also delete your personal data, add `--purge`:
```bash
curl -fsSL https://raw.githubusercontent.com/Surya-T-S/Doit/main/scripts/uninstall-linux.sh | bash -s -- --purge
```
Installed via `.deb`: `sudo apt remove doit` (add `~/.config/Doit` removal to wipe data).

> You can also wipe data from inside the app: **Settings → Danger Zone → Wipe All Data**.

---

### Development

```bash
git clone https://github.com/Surya-T-S/Doit.git
cd Doit
npm install
npm run electron:dev
```


