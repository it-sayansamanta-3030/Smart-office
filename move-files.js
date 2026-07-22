const fs = require('fs');
const path = require('path');

const root = 'c:\\new project\\Smart Office Tracking';
const frontendDir = path.join(root, 'frontend');
const backendDir = path.join(root, 'backend');

const frontendFiles = ['src', 'index.html', 'vite.config.js', 'dist'];
const backendFiles = ['routes', 'data', '.env', 'seed-supabase.js'];

for (const file of frontendFiles) {
  const src = path.join(frontendDir, file);
  const dest = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log(`Moved ${file}`);
  }
}

for (const file of backendFiles) {
  const src = path.join(backendDir, file);
  const dest = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log(`Moved ${file}`);
  }
}

// Rename backend/index.js to root/server.js
if (fs.existsSync(path.join(backendDir, 'index.js'))) {
  fs.renameSync(path.join(backendDir, 'index.js'), path.join(root, 'server.js'));
  console.log('Moved and renamed index.js to server.js');
}

// Remove frontend and backend folders
fs.rmSync(frontendDir, { recursive: true, force: true });
fs.rmSync(backendDir, { recursive: true, force: true });
console.log('Deleted frontend and backend directories.');
