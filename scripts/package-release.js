import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import zlib from 'node:zlib';

const ROOT_DIR = process.cwd();
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const BUNDLE_DIR = path.join(RELEASE_DIR, 'bundle');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getDirSize(dirPath, excludeDirs = new Set()) {
  let total = 0;
  if (!fs.existsSync(dirPath)) return 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (excludeDirs.has(entry.name)) continue;
      total += getDirSize(fullPath, excludeDirs);
    } else if (entry.isFile()) {
      try {
        total += fs.statSync(fullPath).size;
      } catch {}
    }
  }
  return total;
}

function copyDirRecursive(src, dest, excludeNames = new Set()) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeNames.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, excludeNames);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('===========================================================');
console.log('🚀 CLINIC MANAGER PRODUCTION RELEASE PACKAGER');
console.log('===========================================================\n');

// 1. Clean release directory
if (fs.existsSync(RELEASE_DIR)) {
  console.log('🧹 Cleaning old release directory...');
  fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUNDLE_DIR, { recursive: true });

// 2. Verify / copy core deployable files
console.log('📦 Assembling deployable production runtime bundle...');

// Copy package.json
fs.copyFileSync(path.join(ROOT_DIR, 'package.json'), path.join(BUNDLE_DIR, 'package.json'));

// Copy .env if exists
if (fs.existsSync(path.join(ROOT_DIR, '.env'))) {
  fs.copyFileSync(path.join(ROOT_DIR, '.env'), path.join(BUNDLE_DIR, '.env'));
}

// Copy next.config.ts
if (fs.existsSync(path.join(ROOT_DIR, 'next.config.ts'))) {
  fs.copyFileSync(path.join(ROOT_DIR, 'next.config.ts'), path.join(BUNDLE_DIR, 'next.config.ts'));
}

// Copy public directory (assets)
if (fs.existsSync(path.join(ROOT_DIR, 'public'))) {
  copyDirRecursive(path.join(ROOT_DIR, 'public'), path.join(BUNDLE_DIR, 'public'));
}

// Copy db directory
if (fs.existsSync(path.join(ROOT_DIR, 'db'))) {
  copyDirRecursive(path.join(ROOT_DIR, 'db'), path.join(BUNDLE_DIR, 'db'));
}

// Copy prisma schema
if (fs.existsSync(path.join(ROOT_DIR, 'prisma'))) {
  copyDirRecursive(path.join(ROOT_DIR, 'prisma'), path.join(BUNDLE_DIR, 'prisma'));
}

// Copy src/generated
if (fs.existsSync(path.join(ROOT_DIR, 'src', 'generated'))) {
  copyDirRecursive(path.join(ROOT_DIR, 'src', 'generated'), path.join(BUNDLE_DIR, 'src', 'generated'));
}

// Copy .next EXCLUDING .next/cache (build cache is 200MB+ of dev data, never deployed)
if (fs.existsSync(path.join(ROOT_DIR, '.next'))) {
  console.log('⚡ Copying compiled Next.js production output (excluding .next/cache)...');
  copyDirRecursive(path.join(ROOT_DIR, '.next'), path.join(BUNDLE_DIR, '.next'), new Set(['cache', 'dev']));
}

// 3. Calculate Bundle Size
const bundleSizeBytes = getDirSize(BUNDLE_DIR);
const bundleSizeMB = bundleSizeBytes / (1024 * 1024);

console.log('\n-----------------------------------------------------------');
console.log(`📊 Production Deployable Bundle Size: ${formatBytes(bundleSizeBytes)} (${bundleSizeMB.toFixed(2)} MB)`);
console.log('-----------------------------------------------------------');

const LIMIT_MB = 200;
if (bundleSizeMB <= LIMIT_MB) {
  console.log(`✅ SUCCESS: Deployable bundle is strictly UNDER ${LIMIT_MB} MB!`);
} else {
  console.error(`❌ FAILED: Deployable bundle (${bundleSizeMB.toFixed(2)} MB) exceeds ${LIMIT_MB} MB!`);
  process.exit(1);
}

// 4. Create compressed zip archive using PowerShell or native archiver
const zipPath = path.join(RELEASE_DIR, 'clinic-manager-v1.0.0-release.zip');
console.log(`\n🗜️  Compressing into distributable archive: ${path.basename(zipPath)}...`);
try {
  execSync(
    `powershell -Command "Compress-Archive -Path '${BUNDLE_DIR}\\*' -DestinationPath '${zipPath}' -Force -CompressionLevel Optimal"`,
    { stdio: 'inherit' }
  );
  const zipStats = fs.statSync(zipPath);
  console.log(`🎉 Compressed Archive Created: ${formatBytes(zipStats.size)} (${(zipStats.size / (1024 * 1024)).toFixed(2)} MB)`);
} catch (err) {
  console.log('Note: Compress-Archive failed, bundle folder is available as deployable directory.');
}

console.log('\n===========================================================');
console.log('🏁 AUDIT & RELEASE PACKAGING COMPLETE');
console.log('===========================================================\n');
