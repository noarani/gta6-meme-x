// Entry program for make.fun's "Post a GTA 6 meme on X" bounty (gta6-meme-x-01).
//
// Node 22, standard library only, no network. The entry itself is the meme post
// on X; this program is the repository's entrypoint: it reads POST.json (the
// file the bounty's entry_link check reads), validates the post's address and
// prints a formatted summary. When MAKEFUN_OUTPUT_DIR is set (the grader's
// /output), it also writes the summary there as post-summary.json.
//
// Run it:  node main.ts

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const postFile = join(here, 'POST.json');

/** An X post address: https://x.com/<handle>/status/<digits> (twitter.com also passes). */
const POST_URL = /^https:\/\/(x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d{1,25})\/?$/;

/** Markers that mean POST.json still holds the template placeholder, not a real post. */
const PLACEHOLDER = /REPLACE|PLACEHOLDER|YOUR_/i;

interface PostRecord {
  url: string;
}

function fail(message: string): never {
  process.stderr.write(`gta6-meme-x-01: ${message}\n`);
  process.exit(1);
}

let raw: string;
try {
  raw = readFileSync(postFile, 'utf8');
} catch {
  fail(`POST.json not found beside main.ts (${postFile})`);
}

let record: PostRecord;
try {
  record = JSON.parse(raw) as PostRecord;
} catch {
  fail('POST.json is not valid JSON');
}

const url = typeof record.url === 'string' ? record.url.trim() : '';
if (url === '') fail('POST.json has no "url" string');

const match = POST_URL.exec(url);
const placeholder = PLACEHOLDER.test(url);

const lines: string[] = [];
lines.push('make.fun bounty: gta6-meme-x-01 (Post a GTA 6 meme on X)');
lines.push(`post url:    ${url}`);
if (match) {
  lines.push(`host:        ${match[1]}`);
  lines.push(`account:     @${match[2]}`);
  lines.push(`status id:   ${match[3]}`);
  lines.push('url form:    valid (https://x.com/<handle>/status/<id>)');
} else {
  lines.push('url form:    INVALID (want https://x.com/<handle>/status/<id>)');
}
lines.push(`placeholder: ${placeholder ? 'yes (template value, not a real post yet)' : 'no'}`);
process.stdout.write(lines.join('\n') + '\n');

if (!match) fail('the url in POST.json is not a well-formed X post address');
if (placeholder) fail('POST.json still holds the placeholder; write the real post address first');

const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (outDir) {
  const summary = {
    competition: 'gta6-meme-x-01',
    url,
    host: match[1],
    account: match[2],
    status_id: match[3],
  };
  writeFileSync(join(outDir, 'post-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  process.stdout.write(`summary written: ${join(outDir, 'post-summary.json')}\n`);
}
