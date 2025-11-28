// Edge Impulse image feature packing helpers

// Align with Edge Impulse mobile client camera pipeline:
// for each pixel, push a single integer: (R << 16) | (G << 8) | B
// length = width * height
export function packImageToEiFeatures(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number,
): number[] {
  const { data } = imageData
  const features: number[] = []
  const pixelCount = targetWidth * targetHeight

  for (let ix = 0; ix < pixelCount; ix++) {
    const base = ix * 4
    const r = data[base]
    const g = data[base + 1]
    const b = data[base + 2]
    // eslint-disable-next-line no-bitwise
    const packed = (r << 16) | (g << 8) | b
    features.push(packed)
  }

  return features
}
