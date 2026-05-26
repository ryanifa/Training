// Rendert icon.svg naar de PWA-PNG's met @resvg/resvg-js (uit /tmp/node_modules).
const fs = require('fs');
const { Resvg } = require('/tmp/node_modules/@resvg/resvg-js');

const svg = fs.readFileSync('icon.svg');
const fontOpts = {
  loadSystemFonts: true,
  defaultFontFamily: 'DejaVu Sans'
};

[512, 192, 180].forEach(size => {
  const resvg = new Resvg(svg, { font: fontOpts, fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const name = (size === 180 ? 'icon-180' : 'icon-' + size) + '-v2.png';
  fs.writeFileSync(name, png);
  console.log('geschreven:', name, png.length, 'bytes');
});
