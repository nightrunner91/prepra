import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readReadme(sectionId: string): string | null {
  const filePath = join(__dirname, "../../../docs", sectionId, "README.md");

  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export type SectionSubgroup = {
  title: string;
  slugs: string[];
};

export type SectionGroup = {
  title: string;
  slugs: string[];
  subgroups: SectionSubgroup[];
};

/**
 * Normalizes a slug for fuzzy matching between README links and Astro entry ids.
 * READMEs may use underscores (e.g. `next_routing.md`) while actual files use
 * hyphens (`next-routing.md`).
 */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[_-]/g, "");
}

/**
 * Reads the section README and extracts grouped article links.
 * H2 headings become groups, H3 headings become subgroups.
 */
export function parseSectionReadme(sectionId: string): SectionGroup[] {
  const content = readReadme(sectionId);
  if (!content) return [];

  const lines = content.split("\n");
  const groups: SectionGroup[] = [];
  let currentGroup: SectionGroup | null = null;
  let currentSubgroup: SectionSubgroup | null = null;

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match) {
      currentGroup = {
        title: h2Match[1].trim(),
        slugs: [],
        subgroups: [],
      };
      currentSubgroup = null;
      groups.push(currentGroup);
      continue;
    }

    if (h3Match && currentGroup) {
      currentSubgroup = {
        title: h3Match[1].trim(),
        slugs: [],
      };
      currentGroup.subgroups.push(currentSubgroup);
      continue;
    }

    if (!currentGroup) continue;

    // Only consider list items (ordered or unordered).
    if (!line.match(/^(\d+\.|-)\s+/)) continue;

    let match: RegExpExecArray | null;
    const slugs: string[] = [];

    while ((match = linkRegex.exec(line)) !== null) {
      const href = match[2];
      if (!href.startsWith("./")) continue;

      const slug = href
        .replace(/^\.\//, "")
        .replace(/\.md$/i, "")
        .replace(/#.*$/, "");

      if (slug) slugs.push(slug);
    }

    linkRegex.lastIndex = 0;

    if (slugs.length === 0) continue;

    if (currentSubgroup) {
      currentSubgroup.slugs.push(...slugs);
    } else {
      currentGroup.slugs.push(...slugs);
    }
  }

  return groups.filter(
    (group) =>
      group.slugs.length > 0 || group.subgroups.some((sub) => sub.slugs.length > 0),
  );
}

function generateFallbackDescription(
  sectionLabel: string,
  groups: SectionGroup[],
): string {
  const groupNames = groups.map((group) => group.title.toLowerCase());

  if (groupNames.length === 0) {
    return `Раздел «${sectionLabel}»: подборка материалов для подготовки к собеседованиям.`;
  }

  if (groupNames.length === 1) {
    return `Раздел «${sectionLabel}»: ${groupNames[0]}.`;
  }

  const last = groupNames[groupNames.length - 1];
  const rest = groupNames.slice(0, -1).join(", ");

  return `Раздел «${sectionLabel}» охватывает темы: ${rest} и ${last}.`;
}

/**
 * Extracts the description paragraph from the section README (the first
 * paragraph after the H1 title and before the first H2).
 * Falls back to an auto-generated description based on group titles.
 */
export function parseSectionDescription(
  sectionId: string,
  sectionLabel: string,
): string {
  const content = readReadme(sectionId);
  const groups = parseSectionReadme(sectionId);

  if (!content) {
    return generateFallbackDescription(sectionLabel, groups);
  }

  const lines = content.split("\n");
  let passedTitle = false;
  const descriptionLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("# ")) {
      passedTitle = true;
      continue;
    }

    if (!passedTitle) continue;
    if (line.startsWith("## ")) break;
    if (line === "") {
      if (descriptionLines.length > 0) break;
      continue;
    }

    descriptionLines.push(line);
  }

  const description = descriptionLines.join(" ").trim();

  if (description) {
    return description;
  }

  return generateFallbackDescription(sectionLabel, groups);
}
