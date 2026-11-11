---
name: tarotai
description: A pocket oracle printed like a modern grimoire.
colors:
  ember: "#ff5a36"
  ember-row: "#ffd3c6"
  stamp: "#9e2a14"
  salmon: "#ffb199"
  ink: "#140c0a"
  paper: "#fff6f0"
  disabled: "#6a3a30"
typography:
  display:
    fontFamily: "Host Grotesk, Avenir Next, sans-serif"
    fontSize: "clamp(3.15rem, 8vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Host Grotesk, Avenir Next, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.4rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Host Grotesk, Avenir Next, sans-serif"
    fontSize: "clamp(1.7rem, 4vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  lead:
    fontFamily: "Host Grotesk, Avenir Next, sans-serif"
    fontSize: "clamp(1.25rem, 2.4vw, 1.7rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Host Grotesk, Avenir Next, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  fine:
    fontFamily: "Host Grotesk, Avenir Next, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  control: "2px"
  square: "0px"
  mark: "50%"
spacing:
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "22": "22px"
  "28": "28px"
  "36": "36px"
  "48": "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-disabled:
    backgroundColor: "{colors.disabled}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-on-ink:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-on-ink-hover:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
    width: "100%"
  chip:
    backgroundColor: "color-mix(in srgb, #fff6f0 35%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "44px"
  chip-hover:
    backgroundColor: "{colors.ember-row}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "44px"
  deck-row:
    backgroundColor: "color-mix(in srgb, #fff6f0 28%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
    height: "72px"
  deck-row-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
    height: "72px"
  spread-tile:
    backgroundColor: "color-mix(in srgb, #fff6f0 28%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
    height: "148px"
  spread-tile-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
    height: "148px"
  keyword:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "3px 8px"
  tab-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    height: "44px"
  limit-panel:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "22px 20px"
  colophon:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "16px 0 0"
  oracle-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    width: "112px"
---

# Design System: tarotai

## Overview

**Creative North Star: "The Pocket Grimoire"**

tarotai is a pocket oracle printed like a modern grimoire. The viewport is an ember field. Type, hairline rules, and borders are near-black ink. Paper is the card, the field, the selected row, and the keyword. The poster voice is Host Grotesk at weight 800, set in uppercase, with a real italic for the stressed phrase. Azeret Mono keeps the indexes, the nav, and the footer small.

The shell is one column inside 1120px. The landing pairs a left-hand poster with a fan of turned cards. The draw is a short sequence of deck rows and spread tiles, then the dealt cards, then the reading. A hard stop, including the spend cap, sits in an ink panel with a stamp-colored offset. Depth is that offset, with no blur. Below 800px the primary nav is an ember bar.

The world is its own brand, apart from the parent site, and it refuses the cream page and the serif tarot template. The wordmark is the lowercase name tarotai beside a four-point sigil. Labels and controls are Title Case, without emoji or em dashes.

**Key Characteristics:**

- Ember field with ink type, rules, and borders
- Paper reserved for cards, fields, selected rows, and keywords
- Host Grotesk 800 uppercase display with a real italic stress
- Azeret Mono at 12px for labels, nav, keywords, and the footer
- Hard offset shadows and a slight turn on the cards
- 2px radius on controls; square cards, rules, keywords, and the cap panel
- Ember mobile tab bar with an ink current state
- Sigil wordmark and a mono colophon

## Colors

The palette is a printed poster: one drenched field, one ink, one paper, and a darker ember used only as a stamp.

### Primary

- **Ember** (#ff5a36): The page, the shell, the scrollbar track, and the mobile tab bar. Also the hover fill of a button that sits on the cap panel.
- **Ember Row** (#ffd3c6): The hover wash on deck rows, spread tiles, chips, and choice tiles. A light ember, not a second brand color.

### Secondary

- **Stamp** (#9e2a14): The hard offset under primary buttons and under the cap panel. It is a shadow color, not a fill for type or pages.

### Tertiary

- **Salmon** (#ffb199): The ground of the third geometric card face, beside an ink face and a paper face. The face paints this hex directly. New card geometry should use the salmon token for that ground.

### Neutral

- **Ink** (#140c0a): Text, hairline rules, control borders, the card offset, selection, and the current mobile tab. On the landing poster and in readings it is the only text color.
- **Paper** (#fff6f0): Card grounds, fields, selected rows, keywords, the skip link, and the type on ink buttons and the cap panel.
- **Disabled** (#6a3a30): The fill, border, and dead state of a disabled button. Paper type, no offset.

Selection reverses to ink with paper type. The scrollbar is a 10px ink thumb on an ember track. The color scheme is light.

### Named Rules

**The Ember Field Rule.** The page, the shell, and the mobile tab bar are ember. Paper is a card, a field, a selected choice, or a keyword.

**The Stamp Shadow Rule.** Buttons and the cap panel cast stamp. Cards cast ink. The offset never blurs.

**The One Ink Rule.** Text, hairline rules, and control borders are ink. Ember is the field. The cap panel flips type to paper.

## Typography

**Display Font:** Host Grotesk (with Avenir Next, sans-serif)
**Body Font:** Host Grotesk (with Avenir Next, sans-serif)
**Label/Mono Font:** Azeret Mono (with ui-monospace, monospace)

**Character:** A chunky geometric grotesk shouts the poster. The same family, at text size, carries the reading. Mono is the index: small, tracked, and quiet next to the shout. Italic is a real cut of Host Grotesk, loaded with the roman, and it is reserved for the stressed phrase.

### Hierarchy

- **Display** (800, clamp(3.15rem, 8vw, 6rem), line-height 0.92, tracking -0.04em, uppercase): The landing poster. Max about 12ch. The stressed sentence is italic at the same weight.
- **Headline** (800, clamp(2rem, 5vw, 3.4rem), line-height 0.92, tracking -0.04em, uppercase): Page titles and step titles. Max about 18ch. A step index sits in mono at 0.38em, weight 500, tracking 0.04em, not uppercase.
- **Title** (800, clamp(1.7rem, 4vw, 2.5rem), line-height 0.92, tracking -0.04em, uppercase): The sample thought, the seal ("Your fate is sealed."), and the cap-panel title. Card names inside a reading are 1.35rem, 800, uppercase, tracking -0.04em.
- **Lead** (800, clamp(1.25rem, 2.4vw, 1.7rem), line-height 1.2, tracking -0.04em): The sentence under a thought title. Max about 38ch. The visitor's question on the reveal is italic 800, clamp(1.25rem, 3vw, 1.7rem). An affirmation is italic 800, clamp(1.4rem, 3vw, 2rem), max about 22ch.
- **Body** (400, 16px, line-height 1.5): Reading text, ledes, and notes. Max 62ch. The home lede is 17px and stops at 38ch. Buttons use this size at weight 800 and tracking -0.03em.
- **Fine** (400, 14px, line-height 1.45): Asides, model credits, and secondary lines. Max 62ch. Timing notes are italic 700.
- **Label** (500, 12px, line-height 1.4, tracking 0.04em, Azeret Mono): Group labels, field labels, keywords, and the step index. Nav links use the same face at line-height 1. The footer uses it at line-height 1.45 and tracking 0.03em. Keywords track at 0.03em.

### Named Rules

**The Grotesk Italic Rule.** Display, step titles, and seals are Host Grotesk 800, uppercase, tracked at -0.04em, with line-height 0.92. A stressed phrase is the real italic at the same weight.

**The Mono Index Rule.** Nav, step indexes, keywords, group labels, and the footer are Azeret Mono 500 at 12px. Nav, indexes, and group labels track at 0.04em. Keywords and the footer track at 0.03em. They stay out of the display face.

**The Title Case Rule.** Labels and controls are Title Case. The wordmark stays the lowercase name tarotai.

## Layout

The shell is a centered column, max 1120px, with 20px of side padding and 22px on top. Sections stack with a 36px gap. From 800px the padding becomes 28px 32px 56px and the gap becomes 48px. The page is a flex column: mast, content, colophon. Content itself stacks at 36px.

The landing stacks the poster and the card fan with a 32px gap, then sits them side by side from 960px. A reading step is a 760px column with 22px between its parts. The written reading is a 740px column, centered. Body measure is 62ch. The home lede is 38ch.

Setup steps run question, context, deck, spread, photo, chart. A 4px meter tracks them: the remaining bars are ink at 28% mix, the reached bars are solid ink, with 6px between bars. Choice tiles stack, then sit in a row from 720px. Spread tiles are two columns, then four from 900px. Deck rows stay a single 10px stack.

Below 800px the page clears a fixed tab bar. Bottom padding and scroll padding grow by 128px plus the safe area. The step actions stick just above that bar, on ember, with 8px of vertical padding. From 640px and down, those actions stack full width, primary last.

### Named Rules

**The Pocket Measure Rule.** The shell is a 1120px column. A reading step stops at 760px, the written reading at 740px, body lines at 62ch, and the home lede at 38ch.

**The Ember Bar Rule.** Below 800px the primary nav is a fixed ember bar with a 1px ink rule on top. The current item is ink with paper type. The page and the sticky step actions clear that bar.

## Elevation & Depth

Depth is a rubber stamp. Every shadow is a hard offset with zero blur. Tonal layering is limited to a paper wash on resting rows (paper at 28% or 35% over the ember field) and to the ink meter. There is no ambient glow. The old warm shadow token is transparent and is not a shadow.

### Shadow Vocabulary

- **Card** (`box-shadow: 7px 7px 0 var(--ink)`): Oracle cards at rest. Hover lifts the same shadow to `11px 12px 0 var(--ink)`.
- **Button** (`box-shadow: 4px 4px 0 var(--stamp)`): Primary actions. Hover grows it to `7px 7px 0 var(--stamp)`. Secondary actions use the same 4px offset in ink.
- **Pressed** (`box-shadow: 0 0 0 var(--ink)`, with `translate(2px, 2px)`): The active button. The offset collapses and the control sits down into it.
- **Selected row** (`box-shadow: 4px 4px 0 var(--ink)`): A pressed deck row, spread tile, or choice tile, on a paper fill.
- **Field** (`box-shadow: 4px 4px 0 var(--ink)`): Text fields. Focus keeps that offset and adds `0 0 0 3px var(--paper), 0 0 0 6px var(--ink)`.
- **Photo** (`box-shadow: 5px 5px 0 var(--ink)`): The 120px photo frame.
- **Cap** (`box-shadow: 8px 8px 0 var(--stamp)`): The ink hard-stop panel. Its buttons cast a 4px stamp offset.

### Named Rules

**The Hard Offset Rule.** Shadows are zero-blur offsets. Cards rest at 7px 7px ink and lift to 11px 12px ink. Buttons rest at 4px 4px and grow to 7px 7px. A press moves 2px into the shadow until the offset is gone.

**The Turn Rule.** A dealt card steps about 2.4 degrees off upright. The landing fan rests at -7deg, 1.5deg, and 6deg. Hover turns a card another -1.5deg and lifts it 7px. Reduced motion drops the turn, the lift, and the button nudge.

## Shapes

Corners are almost sharp. Controls, fields, chips, deck rows, and spread tiles take a 2px radius. Cards, keywords, the cap panel, hairline rules, and the photo frame are square. The deck radio is an 18px circle with a 2px ink stroke. Selected, it fills with ink and keeps a 3px paper ring inside.

Borders are 2px ink on controls, cards, and the photo frame. Keywords use a 1.5px ink stroke. Section rules, the mast, the thought blocks, and the colophon use a 1px ink line. The photo drop zone is a 2px dashed ink outline. The sigil is a four-point geometric star, 22px in the wordmark and 16px in the footer, filled with current color.

### Named Rules

**The Almost Sharp Rule.** Controls, fields, deck rows, spread tiles, and chips use a 2px radius. Cards, keywords, the cap panel, rules, and the photo frame stay square. The deck radio is the only circle.

## Components

Controls feel like stamps on a poster: ink borders, a short offset, and a press that flattens the offset. Motion uses `cubic-bezier(0.2, 0.8, 0.2, 1)`. Buttons move in 0.18s. Cards move in 0.28s. The wordmark sigil turns 18deg in 0.45s. A streaming reading spins that sigil for 2.8s, blinks a 2px caret, and sweeps a sheen across skeleton lines.

### Buttons

- **Shape:** Almost sharp (2px radius), 2px ink border, min-height 48px, padding 0 18px.
- **Primary:** Ink fill, paper type, weight 800, 16px, tracking -0.03em. Stamp offset 4px, growing to 7px on hover while the button steps up 2px.
- **Hover / Focus:** Hover keeps the ink fill. Focus uses the paper-and-ink ring. Active translates 2px down and right and clears the offset. Disabled fills with disabled ink, drops the shadow, and does not move.
- **Secondary:** Transparent fill, ink type, 4px ink offset. Hover fills with ink and paper type and steps up 2px. The offset stays 4px.
- **On ink:** Inside the cap panel, primary is paper with ink type and a 4px stamp offset. Hover fills with ember and keeps ink type. Secondary there is transparent paper type, a paper border, and the same stamp offset. Hover fills with paper and ink type.
- **Quiet link:** Weight 800, tracking -0.03em, underlined, offset 3px. Used for skip and in-text actions, with no border and no shadow.

### Chips

- **Style:** Suggestion buttons. Min-height 44px, padding 8px 12px, 14px type, 2px ink border, 2px radius. Resting fill is paper at 35% over the field.
- **State:** Hover and the shared row hover wash turn the fill to ember row. There is no selected chip style. Keywords are a different object: square, paper fill, 1.5px ink border, padding 3px 8px, mono 12px.

### Cards

- **Corner Style:** Square.
- **Background:** Paper shell, 2px ink border. The face is generated art, or a geometric stand-in in ink, paper, or salmon. A missing picture keeps the name on a paper label with a 2px ink border.
- **Shadow Strategy:** The card offset. See Elevation & Depth. Default width 112px, small 92px, medium 124px, large min(156px, 30vw), hero min(260px, 70vw). Aspect ratio 2 / 3.
- **Border:** 2px ink.
- **Internal Padding:** The face is full bleed. The name sits under the shell, 14px, weight 800, tracking -0.03em, with a mono position line.
- **Turn:** Rest rotation comes from the fan or from the deal. Hover lifts 7px and turns -1.5deg further, and the shadow grows. Reduced motion leaves the card upright and still. A flip is a 3D turn to the generated face. Reversed art is rotated 180deg.

### Inputs

- **Style:** Paper fill, ink type, 2px ink border, 2px radius, padding 12px 14px, 4px ink offset. Width 100%. Type is at least 16px. Placeholder ink is #4a2c24.
- **Focus:** The 4px offset stays. A 3px paper ring and a 6px ink ring wrap it. The global outline is cleared on the field so this ring is the focus.
- **Error / Disabled:** Errors are weight 700 ink under the field. The drop zone is a dashed 2px ink box, min-height 180px, paper at 28%, centering a mono label. Hover and drag fill it with paper. A kept photo is a 120px square, 2px ink border, 5px ink offset, with a 32px paper remove control.

### Navigation

- **Mast:** A 1px ink rule under a grid. The wordmark is the sigil plus "tarotai" at 22px, weight 800, tracking -0.04em, min-height 44px. Hover rotates the sigil 18deg.
- **Desktop:** From 800px the mast is three columns. Links are mono 12px, tracking 0.04em, min-height 44px. Hover and current draw a 2px ink underline. The links are Oracle, History, About.
- **Mobile:** Below 800px those links move to a fixed ember bar, 1px ink rule on top, safe-area padding, z-index 40. Each item is a 44px hit. The current item is an ink fill with paper type.
- **Skip:** A paper link, weight 800, parked offscreen until focused.

### Named Rules

**The Paper Focus Rule.** Links, chips, and the wordmark take a 3px paper outline, offset 2px, plus a 6px ink ring. A button keeps its stamp or ink offset and adds the paper outline. A field clears the outline, keeps the 4px ink offset, and adds a 3px paper ring inside a 6px ink ring.

### Deck Rows

A full-width row, min-height 72px, padding 14px 16px, 2px ink border, 2px radius. Resting fill is paper at 28%. The name is 16px, weight 800, tracking -0.03em. The mood is a mono label. The radio sits at the end. Hover fills with ember row. Selected fills with paper, adds a 4px ink offset, and fills the radio.

### Spread Tiles

A grid cell, min-height 148px, padding 12px, the same border, radius, and resting wash as a deck row. A 42px line drawing of the spread sits on top, then the name, a fine description, and a mono card count. Hover washes ember row. Selected fills with paper and adds the 4px ink offset.

### Cap Panel

The hard stop for the spend cap, a failed reading, and a failed PDF. Ink fill, paper type, padding 22px 20px, max-width 440px, square corners, stamp offset 8px. The title uses the title ramp. The cap title is the product message, "The cards need rest, come back later", followed by "The deck is capped for now. Come back when it has had a minute." and a paper Back button. Other stops use the same panel: "The reading did not land.", "The crystal ball is buffering.", "The PDF did not land."

### Colophon

A mono footer, 12px, weight 500, line-height 1.45, tracking 0.03em, with a 1px ink rule above and 16px of padding before it. Three lines. The first is a 16px sigil and the line "Made with a little magic & a lot of math". The second is "Not a prediction. A prompt." The third is nikibirkner.com / tarot-ai, with the site name underlined. From 800px the three lines sit in a row: brand, center, credit at the right.

## Do's and Don'ts

### Do:

- **Do** flood the shell with ember (#ff5a36) and set text, rules, and borders in ink (#140c0a).
- **Do** set posters, step titles, and seals in Host Grotesk 800, uppercase, tracked at -0.04em, and stress a phrase with the real italic at the same weight.
- **Do** set nav, indexes, keywords, and the footer in Azeret Mono 500 at 12px, tracked at 0.04em.
- **Do** print a card with a 2px ink border, a paper ground, a 7px ink offset shadow, and a slight turn.
- **Do** keep the mobile tab bar on ember, with the current item in ink and paper type.
- **Do** show the spend cap and other hard stops in the ink cap panel, with an 8px stamp shadow and a paper button.
- **Do** close every page with the mono colophon: a 16px sigil, "Made with a little magic & a lot of math", "Not a prediction. A prompt.", and nikibirkner.com / tarot-ai.
- **Do** keep labels and controls in Title Case, and keep the wordmark as lowercase tarotai.

### Don't:

- **Don't** set the page on paper or cream. Paper is for cards, fields, selected rows, and keywords.
- **Don't** blur a shadow or use the transparent warm-shadow alias. Depth is a hard offset.
- **Don't** turn the mobile nav into a paper bar.
- **Don't** set display type in a serif or in mono, and don't fake the italic with a slant.
- **Don't** use emoji, stock photos, or em dashes in labels and controls.
- **Don't** add eyebrow labels above headlines. The masthead center line is an existing exception, not a pattern.
- **Don't** treat the legacy aliases (gold, sage, rose, violet, cream, brown) as a palette. They resolve to ink, paper, or ember row.
