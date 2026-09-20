export function classify(item) {
    const title = item.title.toLowerCase(), text = title + ' ' + item.summary.toLowerCase();
    if (/\b(reset|resets|rate limits?|usage limits?|quota|credits? expire)\b/.test(title))
        return { category: 'reset', important: true, reason: 'Title mentions a reset, quota or usage-limit change. Check the source for eligibility.' };
    if (item.sourceId === 'openai-status')
        return { category: 'incident', important: !(/^\[?resolved\]?|resolved:|maintenance completed/i.test(item.title) || /status:\s*resolved|all (?:impacted )?services.*(?:recovered|operational)/i.test(item.summary)), reason: 'Official service-status update. Read the incident for its current state.' };
    if (item.sourceId === 'codex' || item.sourceId === 'claude-code')
        return { category: 'release', important: !/(alpha|beta|rc\d|pre-release)/i.test(title), reason: 'Published in the project’s official release feed. Prereleases stay out of Important.' };
    if (/\b(introducing|launch(?:ing|es|ed)?|releas(?:e|ing|ed)|now available|generally available|pricing|deprecat(?:ed|ion)|breaking change)\b/.test(title))
        return { category: 'release', important: true, reason: 'Title contains a release, availability or product-change signal.' };
    return { category: 'update', important: false, reason: /\b(research|paper|benchmark)\b/.test(text) ? 'Research update. Kept in the full feed, without an urgent alert.' : 'General update. No priority rule matched.' };
}
