import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

// Format bytes to human-readable string
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Compute SHA-256 checksum of a file
function computeSha256(filePath) {
  const hash = crypto.createHash('sha256');
  const fileBuffer = fs.readFileSync(filePath);
  hash.update(fileBuffer);
  return hash.digest('hex');
}

// Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Safe move file or directory (handles Windows cross-device and retry)
function safeMove(src, dest) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dest));
  
  // If destination exists, remove it first
  if (fs.existsSync(dest)) {
    const stat = fs.statSync(dest);
    if (stat.isDirectory()) {
      fs.rmSync(dest, { recursive: true, force: true });
    } else {
      fs.unlinkSync(dest);
    }
  }

  try {
    fs.renameSync(src, dest);
    return true;
  } catch (err) {
    // Fallback to copy + delete if rename fails on Windows
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
      fs.rmSync(src, { recursive: true, force: true });
    } else {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    }
    return true;
  }
}

console.log('\n============================================================');
console.log(`  Doit v${pkg.version} — Unified Multi-Platform Release Pipeline`);
console.log('============================================================\n');

// 1. Compile Frontend (Vite + TypeScript)
console.log('📦 [1/6] Compiling Frontend Web Application...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// 2. Package Web Release
console.log('\n🌐 [2/6] Packaging Web Distribution (release/web)...');
const webDir = path.join(releaseDir, 'web');
ensureDir(webDir);
fs.cpSync(path.join(rootDir, 'dist'), webDir, { recursive: true });
console.log('   ✓ Static web build ready for browser hosting (all OSes).');

// 3. Compile Desktop Backend (Electron Main & Preload)
console.log('\n⚡ [3/6] Compiling Desktop Main & Preload bundles...');
execSync('npm run build:electron', { cwd: rootDir, stdio: 'inherit' });

// 4. Native Desktop Builds
console.log(`\n💻 [4/6] Building Native Desktop Installers (Host: ${process.platform})...`);

const host = process.platform;
ensureDir(path.join(releaseDir, 'windows'));
ensureDir(path.join(releaseDir, 'linux'));
ensureDir(path.join(releaseDir, 'macos'));

if (host === 'win32') {
  // On Windows: Build Windows NSIS installer and Linux package
  console.log('   → Building Windows installer (NSIS)...');
  execSync('npx electron-builder --win', { cwd: rootDir, stdio: 'inherit' });

  console.log('   → Building Linux distribution (zip)...');
  execSync('npx electron-builder --linux zip', { cwd: rootDir, stdio: 'inherit' });

  // Add macOS guidance note for Windows host
  const macReadme = `# macOS Releases for Doit v${pkg.version}

Building macOS executables (.dmg and signed .app bundles) requires Apple's native toolchain (macOS runner).

To build native macOS releases:
1. **GitHub Actions (Recommended - Automated)**:
   A GitHub Actions workflow is provided in \`.github/workflows/release.yml\`.
   Pushing a tag (e.g. \`git tag v${pkg.version} && git push --tags\`) automatically builds native packages for:
   - Windows (\`.exe\`)
   - macOS (\`.dmg\`, \`.zip\`)
   - Linux (\`.AppImage\`, \`.deb\`, \`.tar.gz\`)
   and publishes them directly to your GitHub Releases.

2. **From a Mac**:
   Run \`npm run release\` on any macOS machine to build native \`.dmg\` and \`.zip\` installers.
`;
  fs.writeFileSync(path.join(releaseDir, 'macos', 'README.md'), macReadme, 'utf8');

} else if (host === 'darwin') {
  // On macOS: Build macOS, Windows, and Linux
  console.log('   → Building macOS, Windows, and Linux packages...');
  execSync('npx electron-builder -mwl', { cwd: rootDir, stdio: 'inherit' });

} else {
  // On Linux: Build Linux and Windows
  console.log('   → Building Linux package...');
  execSync('npx electron-builder --linux', { cwd: rootDir, stdio: 'inherit' });

  console.log('   → Building Windows installer...');
  execSync('npx electron-builder --win', { cwd: rootDir, stdio: 'inherit' });
}

// 5. Organize Artifacts into Logical Folders
console.log('\n📁 [5/6] Organizing Artifacts into Logical Platform Folders...');

// Scan root of release folder for loose files/folders to categorize
const looseItems = fs.readdirSync(releaseDir);
for (const item of looseItems) {
  const fullPath = path.join(releaseDir, item);
  
  // Skip target directories and metadata
  if (['windows', 'linux', 'macos', 'web', 'release-manifest.json'].includes(item)) {
    continue;
  }

  // Windows artifacts
  if (item.endsWith('.exe') || item === 'win-unpacked') {
    safeMove(fullPath, path.join(releaseDir, 'windows', item));
    continue;
  }

  // Linux artifacts
  if (item.includes('-linux-') || item.endsWith('.tar.gz') || item.endsWith('.AppImage') || item.endsWith('.deb') || item === 'linux-unpacked') {
    safeMove(fullPath, path.join(releaseDir, 'linux', item));
    continue;
  }

  // macOS artifacts
  if (item.includes('-mac-') || item.endsWith('.dmg') || item === 'mac' || item === 'mac-arm64' || item === 'mac-universal') {
    safeMove(fullPath, path.join(releaseDir, 'macos', item));
    continue;
  }

  // Clean up temporary/debug files
  if (item.endsWith('.blockmap') || item.startsWith('builder-') || item === '.icon-ico' || item.endsWith('.tmp')) {
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    } catch (_) {}
  }
}

// 6. Generate Release Manifest
console.log('\n📋 [6/6] Generating Release Manifest & Checksums...');

const manifest = {
  app: pkg.name,
  productName: pkg.productName || 'Doit',
  version: pkg.version,
  builtAt: new Date().toISOString(),
  hostPlatform: process.platform,
  platforms: {
    windows: {
      description: 'Windows 10 / 11 Native Desktop Installers & Binaries',
      directory: 'release/windows',
      files: []
    },
    linux: {
      description: 'Linux Universal Packages & Binaries',
      directory: 'release/linux',
      files: []
    },
    macos: {
      description: 'macOS Apple Silicon & Intel Packages',
      directory: 'release/macos',
      files: []
    },
    web: {
      description: 'Cross-platform Web Application for all browser environments',
      directory: 'release/web',
      files: []
    }
  }
};

function collectFiles(platformKey, folderName) {
  const targetFolder = path.join(releaseDir, folderName);
  if (!fs.existsSync(targetFolder)) return;
  const items = fs.readdirSync(targetFolder);
  for (const file of items) {
    const fullPath = path.join(targetFolder, file);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && !file.endsWith('.blockmap')) {
      const sizeBytes = stat.size;
      const sha256 = computeSha256(fullPath);
      manifest.platforms[platformKey].files.push({
        name: file,
        sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
        sha256
      });
    } else if (stat.isDirectory()) {
      manifest.platforms[platformKey].files.push({
        name: `${file}/`,
        isFolder: true,
        description: 'Unpacked distribution directory'
      });
    }
  }
}

collectFiles('windows', 'windows');
collectFiles('linux', 'linux');
collectFiles('macos', 'macos');

// Web summary
const webFilesCount = fs.existsSync(webDir) ? fs.readdirSync(webDir).length : 0;
manifest.platforms.web.summary = `${webFilesCount} files ready for web hosting (index.html, assets, logo)`;

const manifestPath = path.join(releaseDir, 'release-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

// Summary Output
console.log('\n============================================================');
console.log(`✨ Release Successfully Built & Organized in /release !`);
console.log('============================================================\n');

console.log('📁 Folder Structure Created:');
console.log('  release/');
console.log('  ├── windows/');
for (const f of manifest.platforms.windows.files) {
  console.log(`  │   ├── ${f.name} ${f.sizeFormatted ? `(${f.sizeFormatted})` : ''}`);
}
console.log('  ├── linux/');
for (const f of manifest.platforms.linux.files) {
  console.log(`  │   ├── ${f.name} ${f.sizeFormatted ? `(${f.sizeFormatted})` : ''}`);
}
console.log('  ├── macos/');
for (const f of manifest.platforms.macos.files) {
  console.log(`  │   ├── ${f.name} ${f.sizeFormatted ? `(${f.sizeFormatted})` : ''}`);
}
console.log('  ├── web/');
console.log(`  │   └── ${manifest.platforms.web.summary}`);
console.log('  └── release-manifest.json (checksums & release metadata)\n');
