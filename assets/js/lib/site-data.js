export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${response.url || url}: ${response.status}`);
  }
  return response.json();
}

export function indexById(records) {
  return Object.fromEntries(records.map((record) => [record.id, record]));
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderInlineMarkdown(value) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function joinDefined(parts, separator = " · ") {
  return parts.filter(Boolean).join(separator);
}
