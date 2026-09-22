import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string(),
  section: z.enum([
    'javascript',
    'typescript',
    'react',
    'nextjs',
    'testing',
    'performance',
    'architecture',
    'state-management',
    'algorithms',
    'api-communication',
    'build-and-deployment',
    'html-css',
    'platforms',
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
    loader: glob({ pattern: ['**/*.md', '!README.md'], base: `../docs/${section}` }),
    schema: articleSchema,
  });
}

export const collections = {
  javascript: articles('javascript'),
  typescript: articles('typescript'),
  react: articles('react'),
  nextjs: articles('nextjs'),
  testing: articles('testing'),
  performance: articles('performance'),
  architecture: articles('architecture'),
  'state-management': articles('state-management'),
  algorithms: articles('algorithms'),
  'api-communication': articles('api-communication'),
  'build-and-deployment': articles('build-and-deployment'),
  'html-css': articles('html-css'),
  platforms: articles('platforms'),
  security: articles('security'),
  ai: articles('ai'),
};
