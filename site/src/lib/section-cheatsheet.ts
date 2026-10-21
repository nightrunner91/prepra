import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type CheatsheetItem = {
  label: string;
  html: string;
};

export type CheatsheetGroup = {
  title: string;
  items: CheatsheetItem[];
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders the tiny inline subset used in cheatsheets: `code` and **bold**.
 */
function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/**
 * Reads `docs/<section>/CHEATSHEET.md`. H2 headings become groups, list items
 * of the form `- **Label:** terms` become entries.
 */
export function parseSectionCheatsheet(sectionId: string): CheatsheetGroup[] {
  const filePath = join(__dirname, "../../../docs", sectionId, "CHEATSHEET.md");
  let content: string;

  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const groups: CheatsheetGroup[] = [];
  let currentGroup: CheatsheetGroup | null = null;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    const h2Match = line.match(/^##\s+(.+)$/);

    if (h2Match) {
      currentGroup = { title: h2Match[1].trim(), items: [] };
      groups.push(currentGroup);
      continue;
    }

    const itemMatch = line.match(/^-\s+(?:\*\*(.+?):?\*\*:?\s*)?(.+)$/);
    if (!itemMatch) continue;

    if (!currentGroup) {
      currentGroup = { title: "", items: [] };
      groups.push(currentGroup);
    }

    currentGroup.items.push({
      label: itemMatch[1] ? itemMatch[1].replace(/:$/, "") : "",
      html: renderInline(itemMatch[2]),
    });
  }

  return groups.filter((group) => group.items.length > 0);
}
