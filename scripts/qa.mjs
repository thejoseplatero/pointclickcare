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

/* visible text = html minus style/script blocks and all tags/attributes */
const visibleText = html
  .replace(/<style>[\s\S]*?<\/style>/g, ' ')
  .replace(/<script>[\s\S]*?<\/script>/g, ' ')
  .replace(/<[^>]+>/g, ' ');

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
  for (const rule of ['.herocard', '.badge', '.proofstrip', '.featgrid', '.console', '.atable', '.arow', '.testimonial', '.roles', '.mrow', '.rescards', '.rwell', '.morecard', 'footer ']) {
    t(`rule present: ${rule.trim()}`, css.includes(rule));
  }
}

/* ---------- the PCC design system (measured; see design-notes.md) ---------- */
section('pointclickcare design system');
t('light system end to end: cream body', /--cream: #FBF8F3/.test(html) && /background: var\(--cream\)/.test(html));
t('measured brand tokens present (forest, lime, sand, mint)',
  /--forest: #435030/.test(html) && /--lime: #F3FEDA/.test(html) && /--sand: #EBDDC4/.test(html) && /--mint: #FAFFF0/.test(html));
t('band system: 32px curved slabs', /--radius-band: 32px/.test(html) && /inner curved/.test(html));
t('hero: their People-of card. white inset, badge, squircle portrait',
  /herocard/.test(html) && /class="hphoto"/.test(html) && /armchair\.jpg/.test(html) &&
  /class="badge"/.test(html) && /border-radius: 18%/.test(html) && /h1::after/.test(html));
t('hero and nav CTAs carry their chevron', (html.match(/Request an interview <i class="chev">/g) || []).length === 2);
t('stat band: forest with lime numerals, their senior-living pattern',
  /\.statement \.inner \{ background: var\(--forest\)/.test(html) && /color: var\(--lime\); \}\n\.stat b i/.test(html));
t('buttons are 4px rectangles, not pills', /--radius-btn: 4px/.test(html) && !/border-radius:\s*96px/.test(html));
t('headings regular weight like theirs', /h1, h2, h3 \{ font-weight: 400/.test(html));
t('custom mark: stacked Jose/Platero tile, forest on lime',
  /marktile/.test(html) && /fill="#435030">Jose<\/text>/.test(html));
t('no sticky-stack scroll panels (nav sticky only)',
  ((html.match(/<style>([\s\S]*?)<\/style>/) || ['',''])[1].match(/position:\s*sticky/g) || []).length === 1);
t('no auto-popup overlays', !/role="dialog"/.test(html));

/* ---------- page anatomy (their product-detail structure) ---------- */
section('page anatomy');
t('announcement strip: one short line', /class="announce"/.test(html) && /A personal application by Jose Platero\. Not affiliated with PointClickCare\./.test(html));
t('h1 is the candidate, product-page style', /<h1>Jose Platero<\/h1>/.test(html));
t('statement: built the org, stated plainly', /Built Air Canada's design organization: the leadership team/.test(html));
t('hero leads with design, not PM or martech', /Leads product design across Air Canada/.test(html));
t('numbers strip: 25 design practice, 9M+, 2x, 1 design system', /data-count="25"/.test(html) && /data-count="9"/.test(html) && /data-count="2"/.test(html) && /data-count="1"/.test(html));
t('count-ups have setTimeout fallback to final values', /setTimeout\(setFinal/.test(html) && /setTimeout\(fireStats, 6000\)/.test(html));
t('4-up feature columns, verb-first titles', (html.match(/class="feat reveal"/g) || []).length === 4 && />Build the org</.test(html) && />Govern the system</.test(html) && />Ship with AI</.test(html) && />Own the outcomes</.test(html));
t('advisor demo: 3 steps, wired run button', (html.match(/class="step"/g) || []).length === 3 && /runbtn\.addEventListener\('click', runAdvisor\)/.test(html));
t('advisor demo: hard fallback to final state', /setTimeout\(finishAdvisor, 8000\)/.test(html));
t('advisor answer cites the record (4+ citations)', (html.match(/class="cite"/g) || []).length >= 4);
t('match bar keeps the flag visible', /mseg flagseg/.test(html) && /Flagged: 1 of 10/.test(html));
t('assessment: ten JD rows', (html.match(/class="arow reveal"/g) || []).length === 10);
t('assessment: 8 direct, 1 adjacent, 1 flagged', (html.match(/chip direct/g) || []).length === 8 && (html.match(/chip adjacent/g) || []).length === 1 && (html.match(/chip flagchip/g) || []).length === 1);
t('design-org row is direct: head of design in practice, ~25-person practice', /Head of design at Air Canada in practice/.test(html) && /about 25 people/.test(html));
t('flagged line is specific: no healthcare experience', /No healthcare experience/.test(html));
t('softened only Jose\'s way (fewer reps, not missing skill)', /fewer daily reps, not a missing skill/.test(html));
t('two testimonial bands, dark then light', /testimonial dark/.test(html) && /testimonial light/.test(html) && (html.match(/<blockquote>/g) || []).length === 2);
t('testimonial quotes are verbatim from the mentions ledger', /people, culture change, and communication/.test(html) && /connecting Jira with Claude via MCP/.test(html));
t('joseplatero.com promoted as its own panel', /The full record is live\./.test(html));
t('no invented 90-day plan (not in the JD)', !/First 90 days|90-day/.test(html));

/* ---------- media: featured row + their resources card row ---------- */
section('media');
t('one featured media row (Webby keynote)', (html.match(/class="mrow reveal"/g) || []).length === 1 && /class="mmedia"><video[^>]*product-led-alliance-summit\.mp4/.test(html));
t('four uniform resource cards', (html.match(/class="rcard reveal"/g) || []).length === 4);
t('media wells share one aspect ratio (the size chaos fix)', /\.rwell \{[^}]*aspect-ratio: 16 \/ 11/.test(html) && /\.mmedia video \{[\s\S]{0,200}?aspect-ratio: 16 \/ 9/.test(html));
t('three videos: keynote, workshop, reel', (html.match(/<video /g) || []).length === 3 && /bts-1\.mp4/.test(html) && /behind-the-work\.mp4/.test(html));
t('all videos lazy (preload=none) with posters', (html.match(/preload="none"/g) || []).length === 3 && (html.match(/poster="https:\/\/joseplatero\.com\/assets\/posters\//g) || []).length === 3);
t('videos have controls, no autoplay', (html.match(/<video controls/g) || []).length === 3 && !/autoplay/.test(html));
t('real titles only, from the story site and the resume',
  />Webby Honoree</.test(html) && />Design System Workshop</.test(html) && />Behind the Work</.test(html) && />Leaders in Design</.test(html) &&
  /The Work Behind the Work: Meta-wins from Air Canada's Homepage Launch/.test(html));
t('podcast card: original soundwave art in PCC colors, not the TW cover',
  /<rect width="400" height="275" fill="#435030"\/>/.test(html) && (html.match(/<line x1="/g) || []).length === 9 && !/\/tw/.test(visibleText));
t('podcast card: real episode title, outlined listen button', /Product Innovation: Charting Your Course/.test(html) && /btn outline" href="https:\/\/www\.thoughtworks\.com[^"]*charting-your-own-course/.test(html));
t('leaders in design photo with real alt text', /panel-mic\.jpg/.test(html) && /Leaders in Design panel/.test(html));
t('all media served from joseplatero.com, none vendored', !/src="assets\//.test(html));

/* ---------- voice: direct, sourced, no meta-commentary ---------- */
section('voice');
t('the word "gap" never appears in visible text', !/\bgaps?\b/i.test(visibleText));
for (const phrase of ['trust is the product', 'formatted like your product', 'flags included',
  'work sample', 'chart summary', 'not a vibe', 'the way the JD asks', "won't pretend",
  'which is the point', 'decision-ready candidate', 'you already get plenty']) {
  t(`no self-commentary: "${phrase}"`, !visibleText.toLowerCase().includes(phrase.toLowerCase()));
}
for (const phrase of ["didn't inherit", 'instead of adding another', 'not a pilot',
  'compounds with every release']) {
  t(`no AI-prose contrast construction: "${phrase}"`, !visibleText.toLowerCase().includes(phrase.toLowerCase()));
}
for (const phrase of ['used across the team', "into the team's daily workflow", 'wired AI into',
  'AI operating model']) {
  t(`no AI-adoption overclaim: "${phrase}"`, !visibleText.toLowerCase().includes(phrase.toLowerCase()));
}
t('AI claim grounded: agents named with their real function, no Jira namedrop in the pitch copy', /discovery to prototype to reporting/.test(visibleText) && !/from live Jira/.test(visibleText));
t('AI claim stays scoped to what he built, no org-wide adoption claim', !/across the org|org-wide|used across the team/i.test(visibleText.match(/Built agents and skills[\s\S]{0,300}/)?.[0] || ''));
t('no AI-speak filler (delve/tapestry/seamless/journey)', !/\bdelve\b|\btapestry\b|\bseamless(ly)?\b|\bjourney\b/i.test(visibleText));
t('no banned vague verbs (surface/leverage)', !/\bsurfaces?\b|\bleverage\b/i.test(visibleText));

/* ---------- honesty and disclosure ---------- */
section('honesty and disclosure');
t('disclaimer present (not affiliated)', /Not affiliated with or endorsed by PointClickCare/.test(html));
t('demo declared illustrative', /illustrative demo/i.test(html));
t('BCG never named', !/BCG/.test(html));
t('Thoughtworks only as the public podcast, never as an Air Canada partner',
  (html.match(/[Tt]houghtworks/g) || []).length === 2 && !/partnership with Thoughtworks/i.test(html));
t('no years-of-experience bragging', !/15\+?\s*(yrs|years)|fifteen years/i.test(html));

/* ---------- accessibility ---------- */
section('accessibility');
const extLinks = [...html.matchAll(/<a [^>]*href="https?:\/\/[^"]*"[^>]*>/g)].map(m => m[0]);
t(`external links use rel=noopener (${extLinks.length})`, extLinks.length > 0 && extLinks.every(a => /rel="noopener"/.test(a)));
t('reduced-motion respected (CSS + JS)', (html.match(/prefers-reduced-motion/g) || []).length >= 2);
t('menu button carries aria-expanded', /aria-expanded/.test(html));
t('advisor input labelled', /aria-label="Hiring question"/.test(html));
t('match bar aria-label states the real split', /aria-label="Match: 8 of 10 direct, 1 of 10 adjacent, 1 of 10 flagged"/.test(html));
t('images have alt text', ![...html.matchAll(/<img [^>]*>/g)].some(m => !/alt="/.test(m[0])));

/* ---------- responsive ---------- */
section('responsive');
t('mobile nav breakpoint present', /@media \(max-width: 720px\)/.test(html));
t('hero card stacks on mobile', /@media \(max-width: 880px\) \{\n  \.herocard \{ grid-template-columns: 1fr/.test(html));
t('proofstrip collapses to 2-up', /@media \(max-width: 820px\) \{ \.proofstrip/.test(html));
t('assessment rows stack on mobile', /@media \(max-width: 700px\) \{\n  \.arow \{ grid-template-columns: 1fr/.test(html));
t('featured media row stacks on mobile', /@media \(max-width: 820px\) \{ \.mrow \{ grid-template-columns: 1fr/.test(html));
t('resource cards step down 4-2-1', /@media \(max-width: 940px\) \{ \.rescards \{ grid-template-columns: repeat\(2, 1fr\)/.test(html) && /@media \(max-width: 520px\) \{ \.rescards \{ grid-template-columns: 1fr/.test(html));

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
