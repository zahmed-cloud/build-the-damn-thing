/**
 * Pixel character sprite data and drawing utilities.
 *
 * Color key (BOTP):
 *   O = outline (#1d1410)   B = body/coral (#e0603a)
 *   S = shade   (#bb4a2a)   F = face      (#241f1c)
 *   E = eyes    (#f2ede1)   A = antenna   (#34a96a)
 */

export const BOTP = {
  O: '#1d1410',
  B: '#e0603a',
  S: '#bb4a2a',
  F: '#241f1c',
  E: '#f2ede1',
  A: '#34a96a'
};

/* Frame 1 — feet parallel (idle / walk-left) */
export const FR = [
  '....OAO....',
  '....OOO....',
  '..OOOOOOO..',
  '.OBBBBBBBO.',
  '.OBFFFFFBO.',
  '.OBFEFFEBO.',
  '.OBFFFFFBO.',
  '.OBBBBBBBO.',
  '.OSSSSSSSO.',
  'OBBBBBBBBBO',
  'OBSSSSSSSBO',
  'OBSSSSSSSBO',
  '..OO...OO..',
  '..OB...BO..'
];

/* Frame 2 — one foot forward (walk-right) */
export const FB = [
  '....OAO....',
  '....OOO....',
  '..OOOOOOO..',
  '.OBBBBBBBO.',
  '.OBFFFFFBO.',
  '.OBFEFFEBO.',
  '.OBFFFFFBO.',
  '.OBBBBBBBO.',
  '.OSSSSSSSO.',
  'OBBBBBBBBBO',
  'OBSSSSSSSBO',
  'OBSSSSSSSBO',
  '...OOOO....',
  '...OB.BO...'
];

/**
 * Draw a pixel-art sprite onto a canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string[]} mat    — sprite matrix (array of row strings)
 * @param {number}   ox     — x offset in canvas pixels
 * @param {number}   oy     — y offset in canvas pixels
 * @param {number}   unit   — size of each sprite pixel
 * @param {boolean}  flip   — mirror horizontally when true
 */
export function drawSprite(ctx, mat, ox, oy, unit, flip) {
  const w = mat[0].length;
  for (let r = 0; r < mat.length; r++) {
    const row = mat[r];
    for (let i = 0; i < row.length; i++) {
      const ch = flip ? row[w - 1 - i] : row[i];
      const col = BOTP[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(
        Math.floor(ox + i * unit),
        Math.floor(oy + r * unit),
        Math.ceil(unit),
        Math.ceil(unit)
      );
    }
  }
}
