export function getBaseUrl(): string {
  return import.meta.env.BASE_URL || '/';
}

export function withBase(path: string): string {
  const base = getBaseUrl();
  if (base === '/') return path;
  
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  
  return `${normalizedBase}${normalizedPath}`;
}
