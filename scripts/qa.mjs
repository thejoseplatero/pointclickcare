#!/usr/bin/env node
/* QA suite for the PointClickCare application page.
   Zero dependencies. Run: node scripts/qa.mjs [--live]
   --live also checks joseplatero.com/pointclickcare and the GitHub Pages mirror,
   plus the joseplatero.com media assets this page embeds. */

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const LIVE = process.argv.includes('--live');

let pass = 0, fail = 0;
const t = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' :: ' + detail : ''}`); }
};
const section = (s) => console.log(`\n== ${s}`);

/* ---------- not indexed: the whole reason this page has its own repo ---------- */
section('not indexed (critical)');
t('meta robots noindex present', /<meta name="robots" content="[^"]*noindex[^"]*">/.test(html));
t('meta robots also nofollow', /<meta name="robots" content="[^"]*nofollow[^"]*">/.test(html));
t('no OG/social preview tags', !/property="og:/.test(html));
t('NO robots.txt in repo (a Disallow would hide the noindex from crawlers)',
  !existsSync(join(root, 'robots.txt')));

/* ---------- document integrity ---------- */
section('document integrity');
t('doctype present', /^<!doctype html>/i.test(html.trim()));
t('lang attribute', /<html lang="en">/.test(html));
t('exactly one <h1>', (html.match(/<h1[\s>]/g) || []).length === 1);
const opens = (tag) => (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
const closes = (tag) => (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
for (const tag of ['section', 'div', 'span', 'h2', 'h3', 'p', 'a', 'button', 'figure', 'blockquote', 'video']) {
  t(`balanced <${tag}> (${opens(tag)})`, opens(tag) === closes(tag), `${opens(tag)} open vs ${closes(tag)} close`);
}
const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
t('all ids unique', new Set(ids).size === ids.length);

/* ---------- css integrity ---------- */
section('css integrity');
{
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  let depth = 0, balanced = true;
  for (const ch of css) { if (ch === '{') depth++; if (ch === '}') depth--; if (depth < 0) balanced = false; }
  t('style braces balanced', balanced && depth === 0);
  const orphans = [];
  let d = 0;
  for (const raw of css.split('\n')) {
    const l = raw.trim();
    if (d === 0 && l && !l.startsWith('/*') && !l.startsWith('@') && !l.startsWith('}') &&
        /^[a-z-]+\s*:/.test(l) && !/^[a-z-]+\s*:\w*\s*(hover|focus|active|before|after)/.test(l)) orphans.push(l.slice(0, 60));
    for (const ch of raw) { if (ch === '{') d++; if (ch === '}') d--; }
  }
  t('no orphaned top-level declarations', orphans.length === 0, orphans.join(' | '));
  for (const rule of ['.hero ', '.proofstrip', '.statement ', '.pains', '.solcards', '.console', '.atable', '.arow', '.roles', '.mediagrid', '.letter ', '.morecard', '.planlist', 'footer ']) {
    t(`rule present: ${rule.trim()}`, css.includes(rule));
  }
}

/* ---------- the PCC design system (measured from their site; see design-notes.md) ---------- */
section('pointclickcare design system');
t('light system end to end: cream body, no dark page bg', /--cream: #FBF8F3/.test(html) && /background: var\(--cream\)/.test(html));
t('measured brand tokens present (forest, lime, sand, mint)',
  /--forest: #435030/.test(html) && /--lime: #F3FEDA/.test(html) && /--sand: #EBDDC4/.test(html) && /--mint: #FAFFF0/.test(html));
t('band system: 32px curved color slabs like theirs', /--radius-band: 32px/.test(html) && /both-curved/.test(html));
t('hero uses their 16px bottom curve', /border-radius: 0 0 16px 16px/.test(html));
t('buttons are 4px rectangles, not pills', /--radius-btn: 4px/.test(html) && !/border-radius:\s*96px/.test(html));
t('headings regular weight like theirs', /h1, h2, h3 \{ font-weight: 400/.test(html));
t('custom mark: stacked Jose/Platero tile, forest on lime (not a reused mark)',
  /marktile/.test(html) && /fill="#435030">Jose<\/text>/.test(html) && !/arc/i.test((html.match(/<svg[\s\S]*?<\/svg>/) || [''])[0]));
t('no sticky-stack scroll panels', !/position:\s*sticky/.test((html.match(/<style>([\s\S]*?)<\/style>/) || ['',''])[1].replace(/nav \{[^}]*\}/, '')));
t('no auto-popup overlays; nothing opens without a click', !/role="dialog"/.test(html) || /hidden/.test(html));

/* ---------- the candidate chart experience ---------- */
section('candidate chart experience');
t('announcement strip mirrors theirs, honest', /class="announce"/.test(html) && /A personal application/.test(html));
t('hero sells with their formula: benefit h1 + mechanism dek + one primary CTA',
  /Design leadership that compounds/.test(html) && /decision-ready, flags included/.test(html));
t('numbers are the proof: 45+, 9M+, 2x, 1 design system', /data-count="45"/.test(html) && /data-count="9"/.test(html) && /data-count="2"/.test(html) && /data-count="1"/.test(html));
t('count-ups have setTimeout fallback to final values', /setTimeout\(setFinal/.test(html) && /setTimeout\(fireStats, 6000\)/.test(html));
t('problem/solution framing in their voice', />The Problem</.test(html) && />The Solution</.test(html) && />Introducing</.test(html));
t('org-builder hook: built it, not inherited', /didn't inherit the org/.test(html));
t('product-fluency hook present', /Product fluency as a design multiplier/.test(html));
t('advisor demo: 3 reasoning steps, wired run button', (html.match(/class="step"/g) || []).length === 3 && /runbtn\.addEventListener\('click', runAdvisor\)/.test(html));
t('advisor demo: hard fallback to final state', /setTimeout\(finishAdvisor, 8000\)/.test(html));
t('advisor answer cites the record (4+ citations)', (html.match(/class="cite"/g) || []).length >= 4);
t('match bar discloses the gap and stays on screen', /mseg gapseg/.test(html) && /The gap: 1 of 10/.test(html));
t('assessment: ten JD rows', (html.match(/class="arow reveal"/g) || []).length === 10);
t('assessment: 7 direct, 2 adjacent, 1 gap', (html.match(/chip direct/g) || []).length === 7 && (html.match(/chip adjacent/g) || []).length === 2 && (html.match(/chip gapchip/g) || []).length === 1);
t('the gap is undefended and specific (care continuum)', /Zero years in healthcare/.test(html));
t('gap softened only Jose\'s way (fewer reps, not missing skill)', /fewer daily reps, not a missing skill/.test(html));
t('letters from the field present (2)', (html.match(/class="letter reveal"/g) || []).length === 2);
t('joseplatero.com promoted as its own panel, not a footer link', /This page is the chart summary\. The record is live\./.test(html));
t('90-day plan maps to JD responsibilities', /Clarify decision rights/.test(html) && /Govern the system/.test(html) && /Make AI adoption real/.test(html) && /Listen first/.test(html));

/* ---------- media band ---------- */
section('media band');
t('media band present with id=watch', /id="watch"/.test(html));
t('three videos: Webby keynote, design system workshop, behind-the-work reel', (html.match(/<video /g) || []).length === 3 && /product-led-alliance-summit\.mp4/.test(html) && /bts-1\.mp4/.test(html) && /behind-the-work\.mp4/.test(html));
t('all videos lazy (preload=none) with posters', (html.match(/preload="none"/g) || []).length === 3 && (html.match(/poster="https:\/\/joseplatero\.com\/assets\/posters\//g) || []).length === 3);
t('videos have controls, no autoplay', (html.match(/<video controls/g) || []).length === 3 && !/autoplay/.test(html));
t('leaders in design photo with real alt text', /panel-mic\.jpg/.test(html) && /Leaders in Design panel/.test(html));
t('pragmatism podcast card links out', /pragmatism-in-practice\/product-innovation-charting-your-own-course/.test(html));
t('all media served from joseplatero.com, none vendored', !/src="assets\//.test(html));

/* ---------- honesty and disclosure ---------- */
section('honesty and disclosure');
t('disclaimer present (not affiliated)', /Not affiliated with or endorsed by PointClickCare/.test(html));
t('demo declared illustrative', /illustrative demo/i.test(html));
t('no invented metrics: every stat traceable to the record',
  !/30,000 providers .* his/.test(html) && !/million.* he saved/i.test(html));
t('BCG never named', !/BCG/.test(html));
t('Thoughtworks only as the public podcast, never as an Air Canada partner',
  (html.match(/[Tt]houghtworks/g) || []).length === 2 && !/partnership with Thoughtworks/i.test(html));
t('no years-of-experience bragging', !/15\+?\s*(yrs|years)|fifteen years/i.test(html));
t('no overclaim on owning the commercial model', !/commercial model included/i.test(html));

/* ---------- accessibility ---------- */
section('accessibility');
const extLinks = [...html.matchAll(/<a [^>]*href="https?:\/\/[^"]*"[^>]*>/g)].map(m => m[0]);
t(`external links use rel=noopener (${extLinks.length})`, extLinks.length > 0 && extLinks.every(a => /rel="noopener"/.test(a)));
t('reduced-motion respected (CSS + JS)', (html.match(/prefers-reduced-motion/g) || []).length >= 2);
t('menu button carries aria-expanded', /aria-expanded/.test(html));
t('advisor input labelled', /aria-label="Hiring question"/.test(html));
t('match bar has an aria-label with the real split', /aria-label="Match: 7 of 10 direct/.test(html));
t('images have alt text', ![...html.matchAll(/<img [^>]*>/g)].some(m => !/alt="/.test(m[0])));

/* ---------- responsive ---------- */
section('responsive');
t('mobile nav breakpoint present', /@media \(max-width: 720px\)/.test(html));
t('proofstrip collapses to 2-up', /@media \(max-width: 820px\) \{ \.proofstrip/.test(html));
t('assessment rows stack on mobile', /@media \(max-width: 700px\) \{\n  \.arow \{ grid-template-columns: 1fr/.test(html));
t('media grid stacks on mobile', /@media \(max-width: 700px\) \{ \.mediagrid \{ grid-template-columns: 1fr/.test(html));

/* ---------- javascript ---------- */
section('javascript');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
t('inline script block found', scripts.length >= 1);
let syntaxOk = true, syntaxErr = '';
try {
  execSync(`node --check /dev/stdin`, { input: scripts.join('\n;\n'), stdio: ['pipe', 'pipe', 'pipe'] });
} catch (e) { syntaxOk = false; syntaxErr = String(e.stderr).slice(0, 120); }
t('all inline JS parses (node --check)', syntaxOk, syntaxErr);

/* ---------- brand rules ---------- */
section('brand rules');
t('zero em dashes', !html.includes('—'));
const emoji = [...html].filter(c => c.codePointAt(0) > 0x1F000);
t('zero emoji', emoji.length === 0);
t('no banned vague verbs (surface/leverage)', !/\bsurfaces?\b|\bleverage\b/i.test(html));
t('no AI-speak filler (delve/tapestry/seamless)', !/\bdelve\b|\btapestry\b|\bseamless(ly)?\b/i.test(html));

/* ---------- content pipeline ---------- */
section('content pipeline');
t('no leftover content markers in built index.html', !/<!--content:/.test(html));

/* ---------- live parity ---------- */
if (LIVE) {
  section('live parity');
  for (const d of ['https://joseplatero.com/pointclickcare/', 'https://thejoseplatero.github.io/pointclickcare/']) {
    try {
      const res = await fetch(`${d}?qa=${Date.now()}`);
      const body = await res.text();
      t(`${d} responds 200`, res.status === 200);
      t(`${d} byte-matches repo (${body.length} vs ${html.length})`, body.length === html.length);
      t(`${d} still carries noindex`, /noindex/.test(body));
    } catch (e) {
      t(`${d} reachable`, false, String(e).slice(0, 80));
    }
  }
  section('live media assets');
  const media = [...html.matchAll(/(?:src|poster)="(https:\/\/joseplatero\.com\/[^"]+)"/g)].map(m => m[1]);
  for (const u of [...new Set(media)]) {
    try {
      const res = await fetch(u, { method: 'HEAD' });
      t(`${u.replace('https://joseplatero.com', '')} responds 200`, res.status === 200);
    } catch (e) {
      t(`${u} reachable`, false, String(e).slice(0, 80));
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
