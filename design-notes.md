# pointclickcare.com design scan notes (2026-07-24)

Source: live browser scan of pointclickcare.com homepage +
/why-pointclickcare/ai-workflows-in-healthcare/ at 1280px (desktop pane),
DOM-measured computed styles (pane throttled below-fold screenshots, so
tokens were verified via getComputedStyle, not eyeballs).

## Tokens (measured)

- Body font: Pangea (licensed, weights 300/400/500/600/700), Arial fallback.
  We approximate with DM Sans (closest open grotesque with the same round,
  humanist temperature at weight 400).
- Ink: #0D0D0D on warm surfaces. Headings are weight 400 (NOT bold): h1 ~56px,
  h2 40px, card heads 24px. Large type at regular weight is the signature.
- Surfaces (all measured live):
  - Pale lime hero band: #F3FEDA (matches the logo background)
  - Primary forest green: #435030 (logo ink, footer bg, announcement bar,
    class name literally `bg-primary`)
  - Cream page body: #FBF8F3
  - Warm sand media band: #EBDDC4
  - Pale mint resources band: #FAFFF0
  - Warm dark gray band: #4B483E
  - White: card and media bands
- Buttons: near-black #0D0D0D bg, white text, border-radius 4px, padding
  8px 16px, weight 400. Nav CTA "Request a Demo" = forest green fill, same
  4px radius. NO pill buttons anywhere. Rectangles with 4px corners.
- Section system ("the curve"): full-bleed blocks on the cream body; each
  block's inner container is a color band with 32px radius on its curved
  edges (`top-curved` = 32px 32px 0 0, `bottom-curved` adds bottom radius,
  hero uses 16px bottom). Bands STACK as rounded color slabs; that stacking
  is the whole visual rhythm of the site.
- Nav: white bar, wordmark left (plain black text logo), center menu items
  with chevrons, green demo button right. Above it a forest-green
  announcement strip, white 18px text, one line + "Discover what's possible."
- Footer: forest green #435030, white text.

## Motion

- Minimal. No parallax, no sticky stacks, no floating objects. Gentle
  fade/translate reveals at most. Matches a healthcare buyer's tolerance.
  Our page inherits that restraint: reveals only, rAF count-ups with
  setTimeout fallback, everything reduced-motion safe.

## Copy voice (formula, from homepage + AI page)

- Benefit headline in plain clinical-operations language + one dek that
  names the mechanism + ONE verb-first CTA ("Explore Solutions",
  "Improve Outcomes", "Remove Blind Spots").
- Eyebrow labels frame sections: "The Problem" / "The Solution" /
  "Introducing".
- Stat pairs with giant regular-weight numerals ("66% ... Yet 11%").
- Four-item lists: two-word bold pain ("Referral bottlenecks", "Leaking
  revenue") or benefit title + one concrete line under it.
- Persona tabs: "For Clinical Staff", "For Admissions and Intake Teams".
- Big 40px statement quotes with name, title, company attribution.
- House vocabulary worth quoting honestly: "care continuum",
  "decision-ready", "system of action", "value that compounds with every
  interaction", "in your workflows, not outside them", "point solutions".
  NOTE: their copy uses the verb "surface"; ours never does (house rule).

## Signature components worth quoting in the pitch page

- The Advisor suite: Chart Advisor, Billing Advisor, Referral Advisor,
  PDPM Coach — AI copilots embedded inside the EHR workflow. This is the
  page's organizing metaphor: the page is a resident chart / Advisor view
  for one candidate.
- Announcement strip above nav (we mirror it for the disclaimer-forward
  "personal pitch, not affiliated" line, turned honest).
- Problem/Solution paired sections with icon grids.
- Testimonial block: oversized quote + attribution (our "letters").
- Marketplace framing: "Over 400 integrations. One partner Marketplace."
  (maps to Jose's martech stack + partner ecosystem work).
- Logo strip band ("We help providers like these") on cream.

## Logo / mark (Phase 0.5)

Their logo is a stacked three-line WORDMARK: Point / Click / Care set
left-aligned in dark forest green on pale lime, tight leading, with a small
registered-mark dot. No pictorial icon; the shape language is the stacked
text block itself plus the dot punctuation of "point" and "click" (cursor/
point metaphor lives in the name, not a glyph).
Jose's mark therefore: a stacked two-line text block "Jose / Platero" set
the same way (tight leading, left-aligned, forest green on lime), with a
small lime/green dot after the name echoing the click-point and their
registered-dot detail. Rendered as inline SVG in the nav. NOT a reuse of
the Affirm arc or the Thomson Reuters dot ring.

## Page rules inherited from the skill (each previously learned by breaking)

- Match their lightness END TO END: this is a LIGHT page (cream body,
  lime/white/sand/green bands). No dark-mode styling.
- One focal object per viewport. No satellite chips.
- Overlays never push layout; nothing auto-pops.
- Numbers loudest element in proof sections; verify computed sizes.
- Decorative curves live at band edges (that's where PCC puts them).
- Honesty framework: Direct fit / Adjacent / The gap, gap also disclosed
  inside the Advisor demo with a visible match bar that stays on screen.
