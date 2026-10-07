const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const files = [
  'index.html',
  'styles.css',
  'app.js',
  'connections.css',
  'connections.js',
  'operator.html',
  'operator.css',
  'operator.js',
  'admin.html',
  'admin.css',
  'admin.js',
  'admin-applications.js',
  'admin-whatsapp.js',
  'admin-approved.js',
  'admin-growth.js',
  'signup.html',
  'signup.css',
  'signup.js',
  'fonts/inter-regular.ttf',
  'fonts/inter-semibold.ttf',
  'fonts/LICENSE.txt',
];

for (const file of files) {
  const output = path.join(root, 'dist', file);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (file.endsWith('.html')) {
    let html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const asset of file === 'index.html' ? ['styles.css', 'app.js', 'connections.css', 'connections.js'] : file === 'operator.html' ? ['styles.css', 'operator.css', 'operator.js', 'connections.css', 'connections.js'] : file === 'signup.html' ? ['styles.css', 'signup.css', 'signup.js'] : ['styles.css', 'admin.css', 'admin.js', 'admin-applications.js', 'admin-whatsapp.js', 'admin-approved.js','admin-growth.js']) {
      const version = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, asset))).digest('hex').slice(0, 12);
      html = html.replace(`"/${asset}"`, `"/${asset}?v=${version}"`);
    }
    fs.writeFileSync(output, html);
  } else {
    fs.copyFileSync(path.join(root, file), output);
  }
}
console.log('Built founder, operator and private admin screens in dist/');
