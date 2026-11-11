# Port 2: Step 1 measurements of grubogrubo.com (2026-11-12, viewport 1692×932)

Measured live in Chrome. Port 2 rebuilds this layout and motion in original code. It uses no assets, code or body copy from the reference.

## Page skeleton (z-order)
| Layer | Notes |
|---|---|
| `canvas#scene` fixed, z0 | WebGL. 5 tilted video planes, each crossed by one huge black letter of the brand. Camera travels down as you scroll. Light mouse parallax. Planes are clickable and open the world screen. |
| `.vignette` fixed, z1 | radial-gradient(at 46% 48%, transparent 44%, rgba(0,0,0,.1) 79%, rgba(0,0,0,.42) 120%) |
| `.grain` fixed, z2 | SVG fractalNoise, opacity .09 |
| `header` fixed, z50 | padding 23px 3vw 16px. Logo 66×48. Manifest 10px/1.5, ls .065em, #d1d1d1, margin 5px 0 0 13px. Nav links have padding 13px 12px and radius 25px; hover gives a violet bg. CONTACT ↗ and EN ⌄ are bordered pills (#777). |
| `.viewport-ui` fixed, z8 | Chapter panel (top 46%, width clamp(170px,17vw,260px), right/left 7vw), scroll-hint bottom-left 3vw/35px, studio-credit bottom-right, 2px page-progress. Hidden during intro and about. |
| `#intro` z5, bg #080808 | padding 116px 6.56vw 65px. Orbit glow 55vw radial. Label 10px ls .17em with violet spans. H1 Arial Black 900 10.65vw, lh .89, ls -.086em, last word violet. Bottom row has a 21px paragraph and an explore-link (min-width 192, border-bottom #777; hover violet with arrow +5px). Hairline #343434 at the bottom. |
| `#work` | Transparent spacer, 4846px tall (≈5.2 viewports). |
| `#about` z14, bg #0b0b0d | padding 155px 6.56vw 130px. Eyebrow → H2 10vw → 2-column grid (margin-left 450px, gap 136px, 24px text) → pill tags (border #595959, radius 40) → 3-column tile grid (gap 16) of tiles 479×340, padding 32, bg #141416, border #3c3c40, accent tile #4c0aaf. |
| `#team` z15, bg #060508 | A sticky full-viewport backdrop video, scrubbed by scroll (violet 3px progress), with a left-dark shade. Heading 9.4vw. The lead text is offset right. A glass profile card on the right (620w, padding 54, rgba(7,6,12,.52), blur 10) holds: kicker, name 94px with a violet dot, a 220px counter with a violet +, two bios, an awards list, and a note. Signature row with round social icons. |
| `#contact` z15, bg #f5f4f0 | padding 120px. Heading 7.2vw. CTA rows have 2px borders and 52px Arial Black; hover turns them grey with the arrow at (6,-6). Footer row 10px ls .17em #555. |
| Cookie | A launcher pill bottom-left (12px). The banner has Reject / Accept (violet). |
| `.world-screen` z31 | Full-screen trailer with an ambient blurred-blob drift (13s). The body sits at left 9vw and rises from -39% to -50% (opacity .65s, transform .85s cubic-bezier(.19,1,.22,1)). It holds a number, a huge 3-line H2 (16vw, 800, lh .78), and a 24px paragraph. Footer: brand / CREATIVE WORLDS · placeholder · timecode. 3px progress. CLOSE × pill fixed top-right. |

## Motion
- **Chapters:** 5. The index changes at about scene progress 0.10, 0.30, 0.47, 0.63. The panel alternates right, left, right… with transition left/right .45s cubic-bezier(.2,.8,.2,1) and opacity .4s.
- **Scroll progress:** the scene eases toward the scroll position rather than tracking it 1:1.
- **Chapter ↗ button:** hover gives white bg, black text and rotate(45deg). Click opens the world screen; the header and viewport UI fade out.
- **motion-reveal:** opacity 0, translateY 27px, blur 5px → visible. Durations: opacity .9s, transform 1s cubic-bezier(.16,1,.3,1), filter .9s. Stagger delays are 0 / .075 / .15 / .225 / .3s.
- **Keyframes:** lineGrow (scaleX .25↔1, 2s), textIn (17px rise), lineIn (scaleX .18→1), worldDrift.
- **Tile hover effects:**
  1. Film letterbox with REC dot and timecode
  2. Social feed: title tinted violet, title copies scrolling, floating hearts, ♥ counter
  3. Bouncing letters
  4. Dark spotlight that follows the cursor, plus episode label
  5. Extruded violet 3D title that tilts with the mouse, plus perspective grid
  6. Arcade HUD (1UP / SCORE), letters drop in, PRESS START blinking
  7. Prompt typing with a blinking caret
