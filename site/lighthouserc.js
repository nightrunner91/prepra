module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --port 4200',
      startServerReadyPattern: 'http://localhost',
      url: [
        'http://localhost:4200/',
        'http://localhost:4200/javascript/',
        'http://localhost:4200/javascript/js-data-types/',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
