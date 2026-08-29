export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function cleanEmailBody(rawBody: string): string {
  if (!rawBody) return "";

  // 1. Decode HTML entities
  let text = decodeHtmlEntities(rawBody);

  // 2. Strip HTML style and script tags + contents
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  
  // 3. Convert HTML line breaks to newlines and strip remaining HTML tags
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");

  // 4. Normalize carriage returns
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 5. Strip quoted email reply history & headers
  text = text.replace(/On\s+.*?\s+wrote:[\s\S]*/gi, "");
  text = text.replace(/-----Original Message-----[\s\S]*/gi, "");
  text = text.replace(/From:\s+.*?\nSent:\s+.*?\n[\s\S]*/gi, "");

  // 6. Strip email signatures
  text = text.replace(/\n--\s*\n[\s\S]*/g, "");

  // 7. Normalize excess whitespace
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return text;
}
