#!/usr/bin/env node

import { createWriteStream } from 'node:fs';
import { readdir, rename, stat, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { ZipArchive } from 'archiver';

async function addDirectoryToArchive(archive, directory, baseDir) {
  const files = await readdir(directory);
  for (const file of files) {
    const filePath = join(directory, file);
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      await addDirectoryToArchive(archive, filePath, baseDir);
    } else {
      const relativePath = filePath.slice(baseDir.length + 1);
      archive.file(filePath, { name: relativePath });
    }
  }
}

async function createExtensionZip() {
  const rootDir = resolve(import.meta.dirname);
  const distDir = join(rootDir, 'dist');
  const assetsDir = join(rootDir, 'assets');
  const outputFile = join(rootDir, 'extension.zip');
  const tempFile = `${outputFile}.tmp`;

  await unlink(tempFile).catch(() => {});

  const output = createWriteStream(tempFile);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const finished = new Promise((resolvePromise, reject) => {
    output.on('close', resolvePromise);
    archive.on('error', reject);
  });

  try {
    archive.pipe(output);
    archive.file(join(rootDir, 'manifest.json'), { name: 'manifest.json' });
    await addDirectoryToArchive(archive, distDir, rootDir);
    await addDirectoryToArchive(archive, assetsDir, rootDir);
    await archive.finalize();
    await finished;
    await rename(tempFile, outputFile);
    console.log(`Extension zip created: ${outputFile}`);
  } catch (error) {
    await unlink(tempFile).catch(() => {});
    throw error;
  }
}

try {
  await createExtensionZip();
} catch (error) {
  console.error('Error creating zip:', error);
  process.exitCode = 1;
}
