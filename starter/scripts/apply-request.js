// Applies a change request from the GitHub "Change request" issue form with
// the scripts in scripts/changes.js. Run by the change-request workflow with
// the issue's text in ISSUE_BODY:
//
//   ISSUE_BODY="$(cat issue.md)" node scripts/apply-request.js
//
// A wording change becomes a scripted text swap; anything else is left for the
// agent (or a person). Sets the workflow output `result` and writes
// request-summary.md, like apply-changes.js.
import { applyChanges } from './changes.js';
import { report } from './apply-changes.js';

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

const form = parseForm(process.env.ISSUE_BODY ?? '');
if (form['What kind of change?'] !== SIMPLE) {
  report([{ done: false, reason: 'This request needs more than a wording swap.' }]);
} else {
  report(applyChanges([{ type: 'text', current: form['Current wording'], new: form['New wording'] }]));
}
