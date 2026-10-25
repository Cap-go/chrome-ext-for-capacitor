#!/usr/bin/env node

import { createWriteStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import archiver from 'archiver';

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

  const output = createWriteStream(outputFile);
  const archive = archiver('zip', { zlib: { level: 9 } });
  const finished = new Promise((resolvePromise, reject) => {
    output.on('close', resolvePromise);
    archive.on('error', reject);
  });

  archive.pipe(output);
  archive.file(join(rootDir, 'manifest.json'), { name: 'manifest.json' });
  await addDirectoryToArchive(archive, distDir, rootDir);
  await addDirectoryToArchive(archive, assetsDir, rootDir);
  await archive.finalize();
  await finished;
  console.log(`Extension zip created: ${outputFile}`);
}

try {
  await createExtensionZip();
} catch (error) {
  console.error('Error creating zip:', error);
  process.exitCode = 1;
}
