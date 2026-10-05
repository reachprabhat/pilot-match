const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const files = [
  'index.html',
  'styles.css',
  'app.js',
  'fonts/inter-regular.ttf',
  'fonts/inter-semibold.ttf',
  'fonts/LICENSE.txt',
];

for (const file of files) {
  const output = path.join(root, 'dist', file);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(path.join(root, file), output);
}
console.log('Built landing page and placeholder ask screen in dist/');
