# Step 1: Reference measurements (grubogrubo.com, 1488×812, measured 2026-11-12)

Measured live in Chrome. Nothing from the reference is copied into the build. Only the layout, rhythm and tokens below are used.

## Stack
- Vanilla JS, no GSAP, Lenis or three.js globals. A `<canvas id="scene">` drives the work section.
- Fonts: system **Arial Black** (display, 900) and **Arial** (body). Nothing is licensed.

## Tokens
| Token | Value |
|---|---|
| body bg | `#050506` |
| section bg | `#080808` |
| text | `#ffffff`, muted `#d1d1d1` |
| accent (violet) | `#4c0aaf` |
| paper (contact bg) | `#f5f4f0`, ink `#090909` |
| h2 | Arial Black 900, ~170px at 1488w, line-height .91, letter-spacing -0.085em |
| h3 | Arial Black 900, 44px, letter-spacing -0.055em |
| nav / labels | Arial 10px, letter-spacing .13em, uppercase |

## Sections (heights at 1488×812)
1. **Header** (fixed): tall condensed wordmark logo, a 3-line uppercase tagline, nav (WORK · STUDIO · INSIGHTS · ABOUT US), a pill CONTACT ↗ and a pill language switcher.
2. **#intro** (932px): a violet small-caps label row, a giant 2-line H1 with the last word in violet, a soft dark radial glow behind it, a 2-line body bottom-left (with the brand word in bold), and SCROLL TO EXPLORE ↓ with an underline bottom-right.
3. **#work** (4846px, about 6 viewports): a sticky stage where tilted media cards masked by giant letters scroll past in 3D. A chapter panel holds `01 / 05`, a short rule, a big title, a 2-line description and a round ↗ button. The panel alternates right and left. Fixed corner labels: SCROLL TO EXPLORE —— (bottom-left) and a 2-line studio label (bottom-right).
4. **#about** (2215px): a giant 2-line H2 with the last word in violet, two body columns offset to the right, a row of outline pill tags, and a 3-column grid of dark cards (number, ↗, big title, description, dot-separated tags). Card 07 is solid violet.
5. **#team** (2184px): a cinematic founder section. The big H2 has its 2nd line in violet, the photo fills the left, and the text sits right. A dark card on the right holds a violet label, the name with a violet period, and a huge stat with "+" in violet. The card blurs in on scroll.
6. **#contact** (footer, 853px, paper bg): a giant "LET'S MAKE IT / BRAND." with the brand in violet, then full-width rows split by 1px dark lines (big bold link + ↗). The footer row has brand / role · BACK TO TOP ↑ · © year.
7. A cookie-settings pill in the bottom-left. It is dropped here because the build has no analytics.

## Motion observed
- Header stays fixed. The tagline highlights words in violet as you scroll.
- Line and blur reveals on enter.
- Work cards move along a 3D tilted path tied to scroll progress, and the chapter text crossfades.
- Founder photo is scrubbed by scroll, and the name card goes from blurred to sharp.
