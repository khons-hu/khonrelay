# Khonrelay

[Open app ↗](https://quiet-signal-khonsu.vercel.app/)

A small inbox for AI updates. OpenAI and DeepMind news, Codex and Claude Code releases, and OpenAI service status. Read the original, save what matters, close the tab.

## What works

- Five official RSS/Atom sources, fetched through a bounded allowlist API.
- Important, releases, reset news, service status and saved views. Importance rules explain themselves.
- Search, read/unread, source muting, saved links, local backups and light/dark themes.
- Combined RSS at `/api/rss`, plus OPML source export.
- Local manual reset reminders. These are not connected to an account.
- Optional in-app browser notifications. Optional hosted daily Web Push backend, disabled until configured.
- TypeScript UI, no frontend framework, no model API calls, no analytics.

Tibo's X account is a direct link. Users can save X posts manually. Automatic X ingestion is not implemented. Saved links are not automatically verified. Personal Codex limits/reset credits are not connected, and the app never redeems credits.

## Run

Node 22+.

```sh
npm ci
npm test
npm start
```

Open http://127.0.0.1:4175/. `npm run build` creates the static UI in `dist/`. Vercel serves the functions from `api/`. Feed failures preserve cached browser items with an explicit warning. Source checks happen on open, manual refresh and every 15 minutes while visible.

## Back up or move to another browser

In Preferences, export a JSON backup before clearing site data or switching browsers. On the other browser, open Preferences and import that file (up to 3 MB).

Import merges saved links, manually added links, read state and reminders with your existing data. It keeps the current theme, source selection and notification preferences. Cached feed items are fetched again rather than restored from the file. The app keeps at most 500 saved links, 500 manual links and 20 reminders.

A backup can contain your private notes and saved URLs. Store it somewhere private. Browser notification permission and hosted push enrollment do not move with the file, so connect each device separately if you want notifications there.

## Hosted notifications

See [setup and privacy details](docs/PUSH.md). Designed for Vercel Hobby's daily cron and a small free-tier Upstash Redis database. Availability and quotas depend on provider terms. No provider account, database, environment secrets or live delivery are included just by deploying the source. The UI reports whether the backend is configured. A configured flag does not prove successful delivery: use the test button and verify a notification with the app closed.

Push enrollment is private and limited to ten devices. Daily digest uses selected sources and quiet hours. A failed source can delay a digest; feeds offer only bounded recent history. No real-time delivery promise.

## Deployment

Connect this GitHub repository to Vercel, framework Other, build `npm run build`, output `dist`. Main is the production branch. PR previews should deploy from the same Git integration. Verify autodeploy with a real commit before claiming it is enabled. The daily cron is at 16:00 UTC; Hobby execution may fall within that hour.

## Privacy and limits

Saved/read state, notes, preferences and reminders stay in browser storage. Optional hosted push stores only device subscription keys, selected sources, timezone, quiet hours and the last checked timestamp. Hosting providers may retain ordinary request logs. No tracking scripts, no private account tokens, no advertising.

RSS content belongs to its publishers. Titles and bounded excerpts link to original sources. Feed text is never interpreted as instructions. Importance is a deterministic heuristic, not an authoritative judgment. No fabricated feed data is bundled.

## Verification

TypeScript build, parser/URL-safety/cache tests, notification authorization and quiet-hour tests. Desktop dark and mobile light layouts reviewed. Save, read/unread, filtering and persistence tested in browser. Live upstream feeds and combined RSS parse successfully. Hosted closed-app delivery remains unverified until infrastructure is connected.

Production status (2026-09-20): all five feeds and combined RSS respond successfully. Vercel GitHub autodeploy is verified. Free Redis and the daily digest are configured, and an authenticated digest request succeeds. Brave returned a push-service registration error on the test device, so device enrollment and closed-app delivery are not yet verified.

## License

Original project code is available under the [MIT License](LICENSE), copyright © 2026 Patrick Obrtal. Third-party components retain their own licenses.
