import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, '..', '..', 'docs');
const CONTENT_DIR = join(__dirname, '..', 'src', 'content');

const DIR_TO_SECTION = {
  'javascript': 'javascript',
  'typescript': 'typescript',
  'react': 'react',
  'next': 'nextjs',
  'testing': 'testing',
  'performance': 'performance',
  'architecture': 'architecture',
  'state-management': 'state-management',
  'algorithms': 'algorithms',
  'api-communication': 'api-communication',
  'build-and-deployment': 'build-and-deployment',
  'html-css': 'html-css',
  'platforms': 'platforms',
  'security': 'security',
};

const SECTION_LABELS = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'react': 'React',
  'nextjs': 'Next.js',
  'testing': 'Testing',
  'performance': 'Performance',
  'architecture': 'Architecture',
  'state-management': 'State Management',
  'algorithms': 'Algorithms',
  'api-communication': 'API Communication',
  'build-and-deployment': 'Build & Deployment',
  'html-css': 'HTML & CSS',
  'platforms': 'Platforms',
  'security': 'Security',
};

function extractTitle(content) {
  const match = content.match(/^# (.+)$/m);
  return match ? match[1].trim() : '';
}

function extractDescription(content) {
  const lines = content.split('\n');
  let desc = '';
  let foundHeading = false;
  for (const line of lines) {
    if (line.startsWith('# ')) {
      foundHeading = true;
      continue;
    }
    if (foundHeading && line.trim() && !line.startsWith('##') && !line.startsWith('---') && !line.startsWith('>')) {
      desc = line.trim();
      break;
    }
  }
  if (desc.length > 200) {
    desc = desc.substring(0, 197) + '...';
  }
  return desc;
}

function extractQuestions(content) {
  const questions = [];
  const checklistMatch = content.match(/## (?:Чеклист|Чеклист перед деплоем|Чеклист оптимизации|Чеклист стратегии)[\s\S]*$/m);
  if (checklistMatch) {
    const checklistSection = checklistMatch[0];
    const itemRegex = /^- \[(?: |x)\] (.+)$/gm;
    let match;
    while ((match = itemRegex.exec(checklistSection)) !== null) {
      let q = match[1].trim();
      q = q.replace(/\.$/, '');
      questions.push(q);
    }
  }
  return questions;
}

function extractTags(title, section) {
  const stopWords = new Set(['в', 'и', 'на', 'с', 'по', 'для', 'как', 'это', 'не', 'но', 'а', 'что', 'из', 'за', 'до', 'от', 'об', 'без', 'при', 'про', 'все', 'его', 'её', 'them', 'the', 'and', 'for', 'with', 'from', 'into', 'how', 'why', 'what', 'when', 'where']);
  const words = title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  return [...new Set(words)].slice(0, 5);
}

function toSlug(filename) {
  return basename(filename, '.md').replace(/_/g, '-');
}

function migrateFile(srcPath, section, order) {
  const content = readFileSync(srcPath, 'utf-8');
  const title = extractTitle(content);
  const description = extractDescription(content);
  const questions = extractQuestions(content);
  const tags = extractTags(title, section);
  const slug = toSlug(basename(srcPath));

  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `section: ${section}`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `order: ${order}`,
    `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
  ];

  if (questions.length > 0) {
    frontmatter.push('questions:');
    for (const q of questions) {
      frontmatter.push(`  - "${q.replace(/"/g, '\\"')}"`);
    }
  }

  frontmatter.push('---');
  frontmatter.push('');

  const bodyStart = content.indexOf('\n', content.indexOf('# ')) + 1;
  const body = content.substring(bodyStart).trimStart();

  const output = frontmatter.join('\n') + '\n' + body;

  const sectionDir = join(CONTENT_DIR, section);
  mkdirSync(sectionDir, { recursive: true });

  const outPath = join(sectionDir, `${slug}.md`);
  writeFileSync(outPath, output, 'utf-8');

  return { slug, title, questions: questions.length };
}

function migrate() {
  const stats = { files: 0, questions: 0, sections: new Set() };

  for (const [dir, section] of Object.entries(DIR_TO_SECTION)) {
    const dirPath = join(DOCS_DIR, dir);
    if (!existsSync(dirPath)) continue;

    const files = readdirSync(dirPath)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .sort();

    files.forEach((file, i) => {
      const result = migrateFile(join(dirPath, file), section, i + 1);
      stats.files++;
      stats.questions += result.questions;
      stats.sections.add(section);
      console.log(`  [${section}] ${result.slug} (${result.questions} questions)`);
    });
  }

  console.log(`\nMigration complete:`);
  console.log(`  Files: ${stats.files}`);
  console.log(`  Sections: ${stats.sections.size}`);
  console.log(`  Questions extracted: ${stats.questions}`);
}

migrate();
