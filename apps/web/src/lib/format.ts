export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function excerpt(html: string, max = 80) {
  const plain = stripHtml(html);
  if (plain.length <= max) return plain;
  return plain.slice(0, max) + "...";
}

export function firstImageSrc(html: string) {
  const match = html.match(/<img\b[^>]*\bsrc=(["'])(.*?)\1/i);
  return match?.[2]?.replace(/&amp;/g, "&") || null;
}
