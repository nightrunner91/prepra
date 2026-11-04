import type { Icon } from "@phosphor-icons/react";
import {
  Atom,
  BracketsCurly,
  Brain,
  Check,
  Code,
  Layout,
  Leaf,
  Lightning,
  Package,
  PlugsConnected,
  Shield,
  TreeStructure,
  Triangle,
} from "@phosphor-icons/react";

export type Section = {
  id: string;
  label: string;
  icon: Icon;
};

/**
 * Единый реестр разделов.
 * Порядок массива — единственный источник правды для главной страницы,
 * сайдбара и мобильной навигации.
 */
export const sections: Section[] = [
  {
    id: "javascript",
    label: "JavaScript",
    icon: Code,
  },
  {
    id: "typescript",
    label: "TypeScript",
    icon: BracketsCurly,
  },
  {
    id: "html-css",
    label: "Браузер и UI",
    icon: Layout,
  },
  {
    id: "react",
    label: "React",
    icon: Atom,
  },
  {
    id: "nextjs",
    label: "Next.js",
    icon: Triangle,
  },
  {
    id: "vue",
    label: "Vue",
    icon: Leaf,
  },
  {
    id: "architecture",
    label: "System Design",
    icon: TreeStructure,
  },
  {
    id: "api-communication",
    label: "API",
    icon: PlugsConnected,
  },
  {
    id: "build-and-deployment",
    label: "Инфраструктура",
    icon: Package,
  },
  {
    id: "testing",
    label: "Тестирование",
    icon: Check,
  },
  {
    id: "performance",
    label: "Производительность",
    icon: Lightning,
  },
  {
    id: "security",
    label: "Безопасность",
    icon: Shield,
  },
  {
    id: "ai",
    label: "AI и LLM",
    icon: Brain,
  },
];

/**
 * Единственный источник правды для списка разделов.
 * Используется в content collections, мок-интервью и JSON-индексах.
 */
export const ALL_SECTION_IDS = sections.map((section) => section.id);
