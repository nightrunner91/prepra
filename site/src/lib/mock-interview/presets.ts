import type { InterviewPreset } from './types';

export const ALL_SECTION_IDS = [
  'javascript',
  'typescript',
  'html-css',
  'react',
  'vue',
  'nuxt',
  'nextjs',
  'testing',
  'performance',
  'architecture',
  'state-management',
  'api-communication',
  'build-and-deployment',
  'security',
  'ai',
] as const;

export const PRESETS: InterviewPreset[] = [
  {
    id: 'react-stack',
    title: 'React-стек',
    description: 'React, TypeScript и хранилища состояния',
    sections: ['react', 'typescript', 'state-management'],
    count: 20,
  },
  {
    id: 'js-core',
    title: 'Основы JavaScript',
    description: 'JavaScript, TypeScript и HTML/CSS',
    sections: ['javascript', 'typescript', 'html-css'],
    count: 30,
  },
  {
    id: 'security',
    title: 'Безопасность',
    description: 'Безопасность и работа с API',
    sections: ['security', 'api-communication'],
    count: 15,
  },
  {
    id: 'full-frontend',
    title: 'Полный фронтенд',
    description: 'Все разделы Prepra',
    sections: [...ALL_SECTION_IDS],
    count: 50,
  },
];