export const sources = Object.freeze([
  { id: 'openai', name: 'OpenAI', url: 'https://openai.com/news/rss.xml', home: 'https://openai.com/news/', kind: 'Research & company' },
  { id: 'deepmind', name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', home: 'https://deepmind.google/blog/', kind: 'Research & company' },
  { id: 'codex', name: 'Codex', url: 'https://github.com/openai/codex/releases.atom', home: 'https://github.com/openai/codex/releases', kind: 'Product releases' },
  { id: 'claude-code', name: 'Claude Code', url: 'https://github.com/anthropics/claude-code/releases.atom', home: 'https://github.com/anthropics/claude-code/releases', kind: 'Product releases' },
  { id: 'openai-status', name: 'OpenAI Status', url: 'https://status.openai.com/history.rss', home: 'https://status.openai.com/', kind: 'Service status' },
].map(source => Object.freeze(source)));
