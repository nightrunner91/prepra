import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const articleSchema = z.object({
  title: z.string(),
  section: z.enum([
    'javascript',
    'typescript',
    'html-css',
    'react',
    'vue',
    'nextjs',
    'testing',
    'performance',
    'architecture',
    'state-management',
    'api-communication',
    'build-and-deployment',
    'security',
    'ai',
  ]),
  description: z.string().optional(),
  order: z.number(),
  tags: z.array(z.string()).optional(),
  relatedArticles: z.array(z.string()).optional(),
  questions: z.array(z.string()).optional(),
});

function articles(section: string) {
  return defineCollection({
    loader: glob({ pattern: ['*.md', '!README.md', '!GUIDE.md'], base: `../docs/${section}` }),
    schema: articleSchema,
  });
}

export const collections = {
  javascript: articles('javascript'),
  typescript: articles('typescript'),
  'html-css': articles('html-css'),
  react: articles('react'),
  vue: articles('vue'),
  nextjs: articles('nextjs'),
  testing: articles('testing'),
  performance: articles('performance'),
  architecture: articles('architecture'),
  'state-management': articles('state-management'),
  'api-communication': articles('api-communication'),
  'build-and-deployment': articles('build-and-deployment'),
  security: articles('security'),
  ai: articles('ai'),
};
