// Applies a simple change request without AI: swaps one piece of wording (a
// sentence, a price, opening hours) for another. Run by the change-request
// workflow with the GitHub issue's text in ISSUE_BODY:
//
//   ISSUE_BODY="$(cat issue.md)" node scripts/apply-request.js
//
// The current wording must appear exactly once in src/, so nothing else
// changes by accident. Anything else is left for the agent (or a person).
// Sets the workflow output `result` to "applied" or "needs-agent", and writes
// a plain-English note to request-summary.md in RUNNER_TEMP (or the current
// folder when run by hand).
import { appendFileSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SIMPLE = 'Change some wording, a price or opening hours';

// GitHub issue forms arrive as "### Question" followed by the answer.
function parseForm(body) {
  const answers = {};
  for (const part of body.replace(/\r\n/g, '\n').split(/^### /m).slice(1)) {
    const [heading, ...rest] = part.split('\n');
    const answer = rest.join('\n').trim();
    answers[heading.trim()] = answer === '_No response_' ? '' : answer;
  }
  return answers;
}

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|astro|svelte|md|json)$/.test(name) ? [path] : [];
  });
}

// The site uses curly quotes (’) but people type straight ones ('), so try both.
const toCurly = (text) => text.replace(/'/g, '’').replace(/"(.*?)"/g, '“$1”').replace(/"/g, '”');
const toStraight = (text) => text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
const variants = (text) => [...new Set([text, toCurly(text), toStraight(text)])];

function finish(result, summary) {
  const file = join(process.env.RUNNER_TEMP ?? '.', 'request-summary.md');
  writeFileSync(file, `${summary}\n`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `result=${result}\n`);
  console.log(`${result}: ${summary}`);
  process.exit(0);
}

const form = parseForm(process.env.ISSUE_BODY ?? '');
const kind = form['What kind of change?'] ?? '';
const current = (form['Current wording'] ?? '').trim();
const replacement = (form['New wording'] ?? '').trim();

if (kind !== SIMPLE) finish('needs-agent', 'This request needs more than a wording swap.');
if (!current || !replacement) finish('needs-agent', 'The current or new wording is missing, so the script can’t do it.');

const hits = [];
for (const file of sourceFiles('src')) {
  const text = readFileSync(file, 'utf8');
  for (const version of variants(current)) {
    // Whole words only, so "Closed" can't match inside "Enclosed".
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'gu');
    const count = [...text.matchAll(pattern)].length;
    if (count) hits.push({ file, version, count, text, pattern });
  }
}
const total = hits.reduce((sum, hit) => sum + hit.count, 0);

if (total === 0) finish('needs-agent', `Couldn’t find “${current}” in the site’s files. Check it’s copied exactly from the site.`);
if (total > 1) {
  const where = hits.map((hit) => `${hit.file} (${hit.count})`).join(', ');
  finish('needs-agent', `“${current}” appears ${total} times (${where}), so the script won’t guess which one. Paste a longer piece of wording.`);
}

const [{ file, version, text, pattern }] = hits;
// Use curly quotes in the new wording, so a straight quote can't break the code
// around it (most wording sits inside '…' strings) and it matches the site.
const styled = file.endsWith('.json') ? replacement : toCurly(replacement);
writeFileSync(file, text.replace(pattern, () => styled));
finish('applied', `Changed “${version}” to “${styled}” in \`${file}\`.`);
