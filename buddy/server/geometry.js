// Maps a point in the downscaled screenshot back to physical screen pixels.
export function toScreen(shot, x, y) {
  const sx = shot.left + Math.round((x * shot.width) / shot.imgW);
  const sy = shot.top + Math.round((y * shot.height) / shot.imgH);
  return {
    x: Math.min(Math.max(sx, shot.left), shot.left + shot.width - 1),
    y: Math.min(Math.max(sy, shot.top), shot.top + shot.height - 1),
  };
}

// Target size for the image Claude sees: max 1280 px wide, keep aspect.
export function fitWidth(width, height, max = 1280) {
  if (width <= max) return { imgW: width, imgH: height };
  return { imgW: max, imgH: Math.round((height * max) / width) };
}
