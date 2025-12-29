// Generate Android launcher icons from assets/icons/logo.svg
// Requires: npm install sharp

const fs = require('fs');
const path = require('path');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Missing dependency "sharp". Run: npm install sharp');
  process.exit(1);
}

const svgPath = path.join(__dirname, '..', 'assets', 'icons', 'logo.svg');
if (!fs.existsSync(svgPath)) {
  console.error('logo.svg not found at', svgPath);
  process.exit(1);
}

const outDir = path.join(__dirname, '..', 'android-res');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
  { name: 'play-store', size: 512 }
];

const svgBuf = fs.readFileSync(svgPath);

(async () => {
  for (const s of sizes) {
    const dir = path.join(outDir, s.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const outPath = path.join(dir, s.name === 'play-store' ? 'ic_launcher-playstore.png' : 'ic_launcher.png');
    try {
      await sharp(svgBuf)
        .resize(s.size, s.size, { fit: 'contain' })
        .png()
        .toFile(outPath);
      console.log('Wrote', outPath);
    } catch (err) {
      console.error('Failed to write', outPath, err);
    }
  }
  console.log('\nGenerated Android icon set in ./android-res. Copy to Android project mipmap-* folders as needed.');
})();
