import { z, defineCollection } from 'astro:content';

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
  ]),
  description: z.string().optional(),
  order: z.number(),
  tags: z.array(z.string()).optional(),
  relatedArticles: z.array(z.string()).optional(),
  questions: z.array(z.string()).optional(),
});

const articlesCollection = defineCollection({
  type: 'content',
  schema: articleSchema,
});

export const collections = {
  javascript: articlesCollection,
  typescript: articlesCollection,
  react: articlesCollection,
  nextjs: articlesCollection,
  testing: articlesCollection,
  performance: articlesCollection,
  architecture: articlesCollection,
  'state-management': articlesCollection,
  algorithms: articlesCollection,
  'api-communication': articlesCollection,
  'build-and-deployment': articlesCollection,
  'html-css': articlesCollection,
  platforms: articlesCollection,
  security: articlesCollection,
};
