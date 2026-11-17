// Mapbox paint properties take sRGB colour strings and cannot read CSS variables or oklch().
// This resolves a design token to an rgba() string at runtime by painting it on a 1px canvas,
// so the map draws with the same tokens as the rest of the interface.
export function tokenColor(name: string, element: Element = document.documentElement): string {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !value) return value;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}
