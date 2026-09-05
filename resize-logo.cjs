const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'logo.jpg');
const outputPath = path.join(__dirname, 'public', 'logo-sm.webp');

sharp(inputPath)
  .resize(84, 84, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  })
  .webp({ quality: 80, effort: 6 })
  .toFile(outputPath)
  .then(info => {
    console.log(`Created logo-sm.webp: `, info);
  })
  .catch(err => {
    console.error(err);
  });
