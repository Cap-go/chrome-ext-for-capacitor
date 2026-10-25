import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/postcss';
import esbuild from 'esbuild';
import postcss from 'postcss';

const root = import.meta.dirname;

await esbuild.build({
  entryPoints: [
    'src/background.ts',
    'src/content.ts',
    'src/devtools_page.ts',
    'src/panel.ts',
  ],
  bundle: true,
  outdir: 'dist',
  target: 'chrome120',
  format: 'esm',
  define: {
    global: 'window',
  },
  plugins: [{
    name: 'chrome-extension',
    setup(build) {
      build.onResolve({ filter: /^chrome$/ }, (args) => ({
        path: args.path,
        namespace: 'chrome-extension',
      }));
      build.onLoad({ filter: /.*/, namespace: 'chrome-extension' }, () => ({
        contents: 'export default chrome',
      }));
    },
  }],
});

const css = readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const result = await postcss([tailwindcss()]).process(css, {
  from: 'src/styles.css',
  to: 'dist/styles.css',
});
writeFileSync(path.join(root, 'dist/styles.css'), result.css);
console.log('CSS processed and written to dist/styles.css');

for (const file of ['devtools_page.html', 'panel.html']) {
  copyFileSync(path.join(root, 'src', file), path.join(root, 'dist', file));
  console.log(`Copied ${file} to dist/`);
}
