export function getUiFont(size: number, isBold: boolean = false): string {
  return `${isBold || size < 14 ? 'bold ' : ''}${Math.max(1, Math.round(size))}px monospace`;
}

export function drawShadowText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW?: number): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  if (maxW !== undefined) {
    ctx.fillText(text, x, y, maxW);
  } else {
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}
