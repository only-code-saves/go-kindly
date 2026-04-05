import sharp from 'sharp';

// Clean heart SVG — two circles + bezier, no transforms
const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="115" fill="#FBEFF5"/>
  <path fill="#FF9999" d="
    M256 390
    C 180 340 68 278 68 192
    C 68 130 112 84 172 84
    C 206 84 236 100 256 126
    C 276 100 306 84 340 84
    C 400 84 444 130 444 192
    C 444 278 332 340 256 390
    Z
  "/>
</svg>`;

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(Buffer.from(heartSvg))
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`);
  console.log(`Generated icon-${size}.png`);
}
