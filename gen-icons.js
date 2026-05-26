// Genereert PWA-iconen zonder externe libraries (handgeschreven PNG via zlib).
// Ontwerp: navy achtergrond (#1a1a2e) + cyaan oplopende balken (#4fc3f7),
// in de stijl van de app-header. Symbool blijft in de veilige zone (center)
// zodat het als maskable/adaptive icoon niet wordt afgekapt.
const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let c, table = crc32.t || (crc32.t = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })());
  c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePng(size, draw) {
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y);
      const o = (y * size + x) * 4;
      px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = a;
    }
  }
  // Filter byte 0 (none) per scanline
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Kleuren
const NAVY = [26, 26, 46];      // #1a1a2e
const CYAN = [79, 195, 247];    // #4fc3f7
const CYAN2 = [120, 210, 250];

function drawIcon(size) {
  // Drie oplopende balken, gecentreerd, in de veilige zone
  const barW = size * 0.13;
  const gap = size * 0.075;
  const totalW = barW * 3 + gap * 2;
  const startX = (size - totalW) / 2;
  const baseY = size * 0.72;
  const heights = [0.26, 0.40, 0.55].map(h => h * size);
  const radius = size * 0.04; // afgeronde balk-bovenkant
  return function (x, y) {
    for (let i = 0; i < 3; i++) {
      const bx0 = startX + i * (barW + gap);
      const bx1 = bx0 + barW;
      const by0 = baseY - heights[i];
      const by1 = baseY;
      if (x >= bx0 && x < bx1 && y >= by0 && y <= by1) {
        // afgeronde bovenhoeken
        const top = by0 + radius;
        if (y < top) {
          const cx = (x < bx0 + radius) ? bx0 + radius : (x > bx1 - radius ? bx1 - radius : x);
          const cy = top;
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy > radius * radius) continue;
        }
        const c = i === 2 ? CYAN2 : CYAN;
        return [c[0], c[1], c[2], 255];
      }
    }
    return [NAVY[0], NAVY[1], NAVY[2], 255];
  };
}

[512, 192, 180].forEach(size => {
  const png = makePng(size, drawIcon(size));
  const name = size === 180 ? 'icon-180.png' : 'icon-' + size + '.png';
  fs.writeFileSync(name, png);
  console.log('geschreven:', name, png.length, 'bytes');
});
