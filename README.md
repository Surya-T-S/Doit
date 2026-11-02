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

#### 🐧 Linux

* **Debian / Ubuntu (`.deb`)** — ⭐ *Recommended for full desktop integration*:
  ```bash
  sudo dpkg -i Doit-linux-1.0.1.deb
  ```
  *Installs system-wide. The Doit logo and desktop entry are immediately added to your Application Launcher, Dock, and GNOME Dash with zero extra steps.*

* **Universal AppImage**:
  ```bash
  chmod +x Doit-linux-1.0.1.AppImage
  ./Doit-linux-1.0.1.AppImage
  ```
  *(Portable single-file execution across all distributions including Fedora, Arch, and openSUSE without root permissions).*

---

### Development

```bash
git clone https://github.com/Surya-T-S/Doit.git
cd Doit
npm install
npm run electron:dev
```


