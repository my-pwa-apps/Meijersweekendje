const sharp = require('sharp');
const fs = require('fs');

const svgBuffer = fs.readFileSync('icon-512.svg');

// Generate 512x512 PNG
sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('icon-512.png')
  .then(() => console.log('Generated icon-512.png'))
  .catch(err => console.error('Error generating 512:', err));

// Generate 192x192 PNG
sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile('icon-192.png')
  .then(() => console.log('Generated icon-192.png'))
  .catch(err => console.error('Error generating 192:', err));
