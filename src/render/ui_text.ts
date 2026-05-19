export function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (maxW <= 0 || text.length === 0) return '';
  if (ctx.measureText(text).width <= maxW) return text;
  const suffix = '...';
  let end = text.length;
  while (end > 0 && ctx.measureText(text.slice(0, end) + suffix).width > maxW) end--;
  return end > 0 ? text.slice(0, end) + suffix : '';
}

export function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxLines = 64,
): string[] {
  if (maxW <= 0 || maxLines <= 0) return [];
  const lines: string[] = [];
  const pushLine = (line: string, truncated = false): boolean => {
    if (lines.length >= maxLines) return false;
    const fitted = fitText(ctx, truncated ? `${line}...` : line, maxW);
    lines.push(fitted);
    return lines.length < maxLines;
  };

  const paragraphs = text.split('\n');
  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (p < paragraphs.length - 1 && !pushLine('')) break;
      continue;
    }
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxW) {
        if (!pushLine(line, false)) {
          lines[lines.length - 1] = fitText(ctx, `${lines[lines.length - 1]}...`, maxW);
          return lines;
        }
        line = word;
      } else {
        line = test;
      }

      if (ctx.measureText(line).width > maxW) {
        const hasMore = i < words.length - 1 || p < paragraphs.length - 1;
        if (!pushLine(line, hasMore)) return lines;
        line = '';
      }
    }
    if (line) {
      const hasMore = p < paragraphs.length - 1;
      if (!pushLine(line, hasMore)) return lines;
    }
  }

  return lines;
}

export function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  maxLines = 64,
): number {
  const lines = wrapTextLines(ctx, text, maxW, maxLines);
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, y + i * lineH);
  return y + lines.length * lineH;
}

export function drawCenteredWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  maxLines = 64,
): number {
  const lines = wrapTextLines(ctx, text, maxW, maxLines);
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'center';
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, y + i * lineH);
  ctx.textAlign = prevAlign;
  return y + lines.length * lineH;
}
