// edge-detect.mjs — Sprint 18 Task 35.3
// Edge-density detection via Sobel operator (sharp). Maps to motion-tier (0-3).
//
// Edge-density is a proxy for "visual heat" — high gradient density correlates
// with motion-rich aesthetics (e.g. brutalism, glitch) vs calm (swiss, liminal).
// The pipeline runs the input image through Sobel-x and Sobel-y kernels via
// sharp.convolve(), computes the per-pixel gradient magnitude, and thresholds
// to a high-gradient pixel ratio (0..1). That ratio buckets to a motion-tier
// (0=Static, 1=Subtle, 2=Expressive, 3=Kinetic).
//
// Pure module: in = Buffer (PNG/JPEG), out = { edge_density, mean_magnitude,
// motion_tier }. No filesystem access. Sharp is loaded lazily so the module
// remains importable on machines without sharp installed (the consumer gets
// a clear error only when detectEdges is actually called).

const HIGH_GRADIENT_THRESHOLD = 50; // 0-255 magnitude scale; matches sprint doc

// Sobel kernels (3x3) in sharp.convolve() shape.
const SOBEL_X = {
  width: 3,
  height: 3,
  kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
};

const SOBEL_Y = {
  width: 3,
  height: 3,
  kernel: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
};

// Run Sobel edge-detection on an image buffer and return density metrics +
// derived motion-tier.
//
// Args:
//   imageBuffer (Buffer): PNG/JPEG-encoded image. Required.
//
// Returns: Promise<{ edge_density: number, mean_magnitude: number,
//                    motion_tier: 0|1|2|3 }>
//   edge_density: fraction of pixels whose Sobel-magnitude exceeds threshold
//                 (0..1).
//   mean_magnitude: average per-pixel gradient magnitude (0..~360).
//   motion_tier: bucketed tier per edgeDensityToMotionTier().
//
// Throws if sharp is not installed (clear error) or if the buffer is invalid.
export async function detectEdges({ imageBuffer }) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error('detectEdges: imageBuffer (Buffer) is required');
  }

  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    throw new Error(
      'sharp is required for edge detection. Install via: npm install sharp',
    );
  }

  // Greyscale → Sobel-x / Sobel-y → raw byte buffers. We resolve both
  // in parallel; sharp pipelines are independent.
  const [gx, gy] = await Promise.all([
    sharp(imageBuffer).greyscale().convolve(SOBEL_X).raw().toBuffer({
      resolveWithObject: true,
    }),
    sharp(imageBuffer).greyscale().convolve(SOBEL_Y).raw().toBuffer({
      resolveWithObject: true,
    }),
  ]);

  // Both buffers must align (same source, same pipeline shape pre-convolve).
  // If they don't, we bail loudly rather than silently mismatch indices.
  if (gx.data.length !== gy.data.length) {
    throw new Error(
      `detectEdges: Sobel buffers misaligned (gx=${gx.data.length}, gy=${gy.data.length})`,
    );
  }

  const totalPixels = gx.info.width * gx.info.height;
  let highGradientCount = 0;
  let totalMagnitude = 0;

  for (let i = 0; i < gx.data.length; i++) {
    const sx = gx.data[i];
    const sy = gy.data[i];
    const mag = Math.sqrt(sx * sx + sy * sy);
    totalMagnitude += mag;
    if (mag > HIGH_GRADIENT_THRESHOLD) highGradientCount++;
  }

  const edgeDensity = totalPixels > 0 ? highGradientCount / totalPixels : 0;
  const meanMagnitude = totalPixels > 0 ? totalMagnitude / totalPixels : 0;

  return {
    edge_density: edgeDensity,
    mean_magnitude: meanMagnitude,
    motion_tier: edgeDensityToMotionTier(edgeDensity),
  };
}

// Map edge-density (0..1) to discrete motion-tier (0..3).
//
// Buckets (per sprint-18 spec):
//   density < 0.05         → 0 (Static)     empty/monochrome surface
//   0.05 ≤ density < 0.15  → 1 (Subtle)     calm composition
//   0.15 ≤ density < 0.30  → 2 (Expressive) texture-rich scene
//   density ≥ 0.30         → 3 (Kinetic)    visual noise / dense pattern
//
// Boundary convention: lower bound inclusive, upper bound exclusive — so
// exactly 0.05 → tier 1, exactly 0.15 → tier 2, exactly 0.30 → tier 3. This
// keeps the buckets non-overlapping and total over [0, 1].
export function edgeDensityToMotionTier(density) {
  if (typeof density !== 'number' || Number.isNaN(density)) return 0;
  if (density < 0.05) return 0;
  if (density < 0.15) return 1;
  if (density < 0.30) return 2;
  return 3;
}
