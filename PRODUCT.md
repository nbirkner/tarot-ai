# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who want a personal tarot reading in a browser, including the maker (a product manager at Together AI who pulls cards in the morning). Inferred from the app copy and the rebrand brief: curious, a little witchy, and comfortable being teased about asking a GPU for advice. No account, no saved cloud profile.

## Product Purpose

Tarot AI draws a real spread, illustrates each card, and writes a reading for a question the visitor actually asked. Success is a finished reading the visitor can sit with, download, and find again in this browser.

## Positioning

An oracle that is sincere about the cards and wry about the model. Ancient practice, freshly hallucinated. The pictures are generated for that reading. The text is not a prediction. It is a prompt.

## Operating Context

A public Next.js app linked from nikibirkner.com at `/tarot-ai`, and also served at `/`. A visitor picks a question, optional context, a deck, a spread, an optional photo, and optional birth data, then draws. Readings stay in local storage on this device. Card art and reading text come from Together AI. A separate change is adding a spend cap and persistent rate limits. Those limits are product behavior this interface must show, not redesign.

## Capabilities and Constraints

- Decks: Dark Gothic, Ethereal, Classic Reimagined, and Osho Zen. Osho Zen has its own spreads and no reversals.
- Spreads: one, three, five, and Celtic Cross on the standard deck. Osho spreads are Super Quickie, Mind · Heart · Being, The Diamond, and Flying Bird.
- Optional photo reference for figures on the cards, and optional sun sign or birth data.
- Streaming card readings, a synthesis, follow-up questions, PDF downloads of the reading and of the cards, and a history page that reads local storage.
- Rate-limit and cap responses use the shared message and the existing API behavior. Do not change the limiter, the API routes' limit logic, model calls, or environment handling.
- Inferred and open: no new accounts, payments, or cloud history were requested.

## Brand Commitments

The name in the interface is tarotai. It is its own brand, separate from the nikibirkner.com design system. Niki chose the Neo-Grimoire direction: ember orange and near-black ink, a chunky geometric grotesk, small monospace labels, a geometric sigil, and hard offset shadows on slightly turned cards. Voice stays wry about AI and sincere about the practice. Either poster line is in bounds: "Your future called. It has notes." or "Ancient practice. Freshly hallucinated." Chrome uses Title Case. No emoji, no stock photos, no em dashes in labels and controls.

## Evidence on Hand

The running app in this repo: landing, reading flow, history, about, and the rate-limit message "The cards need rest, come back later". The Direction C mock is the visual reference. Do not invent testimonials, prices, or customer counts.

## Product Principles

- The cards are the product. Art, names, and the reading stay more prominent than chrome.
- Say what the model is doing without pretending it is destiny.
- A limit is a clear stop, with the real message and a way back.
- Optional steps stay optional. A visitor can draw without a photo, a chart, or a question.
- The brand is one committed world on every state, including loading, empty, error, and the cap.

## Accessibility & Inclusion

WCAG AA contrast for text, including small labels. Visible focus, a keyboard path through the draw and the card flip, and a reduced-motion path that still shows every state. Inferred from the rebrand brief. No other audience-specific requirement was stated.
