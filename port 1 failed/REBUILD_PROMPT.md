# Build Prompt: Studio Site Rebuild (layout and motion modeled on grubogrubo.com)

> Paste this whole file into Claude Code (or another coding agent that has a browser and a shell). It is a full spec for building a one-page studio site. The site copies the **structure, layout rhythm and motion** of https://grubogrubo.com/. All code, copy and branding are original. Devan's own photo is used as the founder/hero person.

---

## 0. Ground rules (read first)

1. **Recreate, don't copy.** Write every line of HTML/CSS/JS yourself. Do not download or hotlink the reference site's logo, photos, videos, OG image, favicon, licensed fonts or scripts.
2. **No original brand name.** Use the placeholder brand `STUDIO NAME` (short form `NAME`) everywhere the reference says "GruboGrubo" / "GRUBO". Keep every brand string in `src/content.js` so Devan can swap it in one place.
3. **The person = Devan's photo.** Wherever the reference shows its founder, use `public/assets/person.jpg` (Devan provides it). Never use the reference founder's name, bio, awards or media.
4. **Placeholder copy.** Use the placeholder text in this spec (or lorem-style text that fits the same length). The section *shapes* and line counts must match the reference so the layout looks the same.
5. **Fonts.** Use free fonts only (Google Fonts or Fontshare). Pick the closest free match to what you measure in step 1.

---

## 1. Phase 1: Inspect the reference (do this before writing code)

The reference's CSS/JS could not be read from a plain fetch, so measure it live in a browser.

1. Open https://grubogrubo.com/ with Playwright (Chromium). Use three viewports: **1440×900**, **1024×768** and **390×844** (iPhone).
2. For each viewport:
   - Take a full-page screenshot, plus one screenshot per section. Save them in `reference/screens/` (local only, never commit or ship them).
   - Record a scroll-through video: `page.video`, scrolling 300px every 250ms from top to bottom. Save it in `reference/video/`.
3. Dump the design tokens with `page.evaluate`, from `getComputedStyle` on `body`, `h1`, `h2`, `nav a`, `.button`-like elements and the section containers:
   - `font-family`, `font-size`, `font-weight`, `letter-spacing`, `line-height`, `text-transform`
   - `color`, `background-color`, `border-color`
   - section `padding` and the grid `gap`
   Save the result to `reference/tokens.json`.
4. Detect the motion stack. In the console, check `window.gsap`, `window.ScrollTrigger`, `window.Lenis` / `window.lenis`, `window.LocomotiveScroll`, `window.THREE`, `window.barba`, `window.SplitText` / `SplitType`. Also list every `<script src>` in the page. Write the findings to `reference/stack.md`.
5. Capture the interactions. Hover each nav item, service row, button and arrow. Move the mouse across the hero to check for a custom cursor or parallax. Click a hero slide/arrow to see whether a full-screen video overlay opens. Click the language dropdown. Screen-record each one, then write down the duration, easing, and what moves (transform, opacity, clip-path, color).
6. Write `reference/NOTES.md`, a short list of each animation with its **trigger → property → from → to → duration → ease → stagger**. Every animation in section 4 must be checked against these notes. **Where the live site differs from section 4, the live site wins.**

> `reference/` is for measurement only. Add it to `.gitignore` and never import anything from it into the build.

---

## 2. Tech stack

- **Vite + vanilla JS (ES modules)**, plain CSS with custom properties. No framework, so the result stays light and can be hosted anywhere.
- **GSAP 3 + ScrollTrigger** (free) for every timeline and scroll animation.
- **Lenis** for smooth scrolling, wired to ScrollTrigger:
  ```js
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  ```
- **SplitType** for splitting text into lines, words and characters.
- If phase 1 finds three.js or WebGL in use, rebuild that effect with three.js using your own shaders and geometry.
- Honour `prefers-reduced-motion`: turn off Lenis, the splits and the parallax, and show the content right away.

### File layout
```
/index.html
/src/main.js            // boot: lenis, preloader, init modules
/src/content.js         // ALL editable text, links, brand, contact  ← Devan edits this
/src/styles/tokens.css  // colors, fonts, spacing scale
/src/styles/base.css
/src/styles/sections.css
/src/modules/preloader.js
/src/modules/cursor.js
/src/modules/heroSlider.js
/src/modules/videoOverlay.js
/src/modules/reveals.js
/src/modules/services.js
/src/modules/founder.js
/src/modules/langMenu.js
/src/modules/cookies.js
/public/assets/person.jpg      ← Devan's photo
/public/assets/logo.svg        ← Devan's logo (placeholder wordmark for now)
/public/assets/slides/01..05.jpg|mp4  ← placeholder media
```

---

## 3. Design system (starting values; replace them with the measurements from phase 1)

| Token | Starting value | Notes |
|---|---|---|
| `--bg` | `#050506` | Near-black (the reference's theme-color) |
| `--fg` | `#F2F0EB` | Warm off-white text |
| `--muted` | `rgba(242,240,235,.55)` | Sub-lines, labels, counters |
| `--line` | `rgba(242,240,235,.14)` | Hairline dividers between list rows |
| `--accent` | measure it | Use only if the reference has one |
| Display font | Wide or condensed grotesk, **uppercase**, tight tracking (`-0.02em`), weight 700–800 | Free options: *Anton*, *Archivo Black*, *Familjen Grotesk*, *Clash Display* (Fontshare) |
| Body font | Neutral grotesk, 400/500 | *Inter*, *Manrope*, *General Sans* |
| Mono/label font | Small uppercase labels, counters like `01 / 05` | *JetBrains Mono* or the body font at 11–12px, `letter-spacing: .12em` |
| Display size | `clamp(56px, 11vw, 220px)`, line-height `.88` | Hero words fill most of the width |
| H2 size | `clamp(40px, 6vw, 110px)`, line-height `.92` | |
| Body size | `clamp(16px, 1.15vw, 20px)`, line-height `1.45` | |
| Gutter | `clamp(16px, 2.2vw, 40px)` | Side padding |
| Section space | `clamp(96px, 16vh, 220px)` | Vertical padding |

Text style rules: headings, nav, labels and buttons are **ALL CAPS**. Body text is sentence case. Arrows (`↗`, `↓`, `↑`, `→`) are plain text glyphs that sit next to labels.

---

## 4. Page structure and motion, section by section

The page is one long scroll, using anchors `#intro`, `#work`, `#about`, `#team`, `#contact`.

### 4.0 Preloader
- Full-screen `--bg` with the brand wordmark in the center (placeholder `NAME`) and a counter from `000` to `100` (mono font, bottom-right).
- The counter follows real asset loading (images and fonts) and lasts at least 1.2s.
- Exit: the wordmark characters slide up out of their line mask (`yPercent: -110`, stagger .02, `power3.in`, .6s). Then the whole panel wipes upward with `clipPath: inset(0 0 100% 0)` over .9s with `expo.inOut`. At 70% of the wipe, start the hero intro timeline.

### 4.1 Header (fixed)
- Left: logo (`/assets/logo.svg`, placeholder wordmark), which links to `#intro`.
- Center or right: nav **WORK · STUDIO · INSIGHTS · ABOUT US · CONTACT ↗**.
- Far right: language switcher **EN ⌄**, a dropdown with 5 rows (`PL Polski`, `EN English`, `UA Українська`, `DE Deutsch`, `ES Español`). Only EN needs to work for now; the others link to `?lang=xx`.
- Small uppercase intro line beside the logo (desktop only): **"WE TURN COMPLEX THINGS INTO SOMETHING WORTH WATCHING."** (placeholder line)
- Behaviour:
  - Use `mix-blend-mode: difference` so the header stays readable over light media.
  - **Nav hover:** a text roll. Each link holds two stacked copies of its label inside an `overflow:hidden` span. On hover both move `yPercent:-100` over .45s with `power3.out`, with chars staggered .015.
  - Hide the header on scroll down and show it on scroll up (`yPercent:-100`, .5s), after 100vh.
  - On mobile, nav collapses to a **MENU** button that opens a full-screen overlay. The links come in as split lines, staggered.

### 4.2 Hero slider (`#intro`), 100vh
- Full-bleed background media for each slide (placeholder images or looping muted mp4s), darkened with a gradient so the text stays readable.
- Counter top-left or bottom-left: **`01 / 05`** (mono). The digits roll vertically when the slide changes.
- A huge one-word title for each slide plus a sub-line, with a `↗` button:
  1. **IDEAS**: "Concepts, campaigns, storytelling"
  2. **FILMS**: "Commercials, branded content"
  3. **ANIMATION**: "2D, 3D, motion design"
  4. **CGI**: "Product, packshots, 3D worlds"
  5. **EXPERIENCES**: "Apps, games, interactive"
  (Placeholder words. Devan edits them in `content.js`.)
- **"SCROLL TO EXPLORE"** cue bottom-center, with a looping 1px line that draws downward (`scaleY 0→1`, origin top, then origin bottom `1→0`, 1.6s loop).
- Second line block (bottom-right, small caps): **"CREATIVE IDEAS & VISUAL PRODUCTION STUDIO"** / **"INDEPENDENT CREATIVE STUDIO / YOUR CITY, COUNTRY"**.
- Motion:
  - **Intro (after the preloader):** title chars rise from `yPercent:110` with a line mask, stagger .03, 1.1s, `expo.out`. The sub-line fades and rises 20px. The background media scales from 1.15 to 1 over 1.8s.
  - **Autoplay** every 5–6s, pausing on hover. Show a thin progress bar under the counter that fills over that time.
  - **Slide change:** the outgoing title chars go up and out (`yPercent:-110`, .6s, `power3.in`). The new media comes in with a clip-path wipe, `inset(100% 0 0 0)` → `inset(0)`, 1s `expo.inOut`, while the old media scales to 1.1. Then the new chars rise in.
  - Mouse moves the background with light parallax (±12px, eased with `gsap.quickTo`, .8s).
  - Swipe on touch and arrow keys on desktop.
  - **Scroll-out:** while the hero scrolls away, the title moves `yPercent:-30` and the media scales to 1.08 and darkens (ScrollTrigger `scrub:true`).
  - Clicking `↗` opens **4.3**.

### 4.3 Full-screen video overlay
- Fixed layer on `--bg` with a 16:9 player (placeholder mp4, or a still with "FULL-SCREEN VIDEO COMING SOON").
- Contents: counter **`01 / 05`**, title **"IDEAS THAT MOVE."**, a one-line tagline, a small label **"NAME / CREATIVE WORLDS"**, a timecode **`00:15`** that counts with the video, and a **CLOSE ×** button.
- Open: `clipPath: circle(0% at <click point>)` → `circle(150%)` over .9s `expo.inOut`, then the text lines rise in. Close reverses this. Esc also closes. Lenis stops while the overlay is open.

### 4.4 Statement: "WE DON'T THINK SMALL."
- Giant H2 on two lines, then one line: **"Ideas. Stories. Images. Products. Experiences."**
- Then: **"Whatever the challenge, we make it ~~BIG~~ `NAME`."** The brand word is set in the display font with an accent treatment, such as an underline that draws in.
- Link **"SCROLL TO EXPLORE ↓"** that goes to `#work`.
- Motion: **line reveal** on scroll. Split the text into lines, each wrapped in `overflow:hidden`, and animate `yPercent:100 → 0`, stagger .08, 1s `expo.out`, starting at `top 80%`. Optionally, scrub the opacity of the words from .15 to 1 as the user scrolls through the paragraph (a highlight-as-you-read effect).

### 4.5 Approach (`#about`): "NOT JUST A PRODUCTION HOUSE."
- Small label above: **"NOT JUST A PRODUCTION HOUSE."** Big H2: **"THE IDEA COMES FIRST."**
- Two-column body on desktop (stacked on mobile):
  - "We don't start with technology. We start with a question: what do we actually need to invent, show or explain?"
  - A second paragraph (placeholder) about picking the right form: campaign, film, animation, CGI or experience.
- Motion: same line reveal as 4.4. The H2 gets a slight horizontal scrub from `x: 5vw` to `0` as it enters.

### 4.6 Work and services (`#work`)
- **Filter or tag row** of pill-shaped uppercase chips: CREATIVE CONCEPTS · VISUAL STORYTELLING · 3D & CGI · ANIMATION · CREATIVE TECH. Hover fills the pill (background slides up from the bottom via a pseudo-element `scaleY 0→1`, and the text color flips).
- **Numbered service list.** Full-width rows with a hairline (`--line`) between them. Each row has: number (`01`–`07`, mono, muted) · title (large, uppercase) · short description (muted, right side) · `↗`.
  1. Commercials: TV, online, branded content
  2. Social / Digital
  3. Animation: 2D / 3D
  4. Micro-series: vertical 9:16, 60s episodes
  5. Product & CGI: packshots, 3D visuals
  6. Apps & Games
  7. AI Workshops: tag "For teams"
- Motion:
  - Rows enter with the hairline drawing left to right (`scaleX 0→1`, origin left, .9s) and the text rising, staggered .06.
  - **Row hover:** the background fills from the bottom (`--fg` at 6% opacity, or inverted). The title shifts `x:24px`. The arrow rotates 45° and moves up and right.
  - **Floating preview:** a 320×220 media card (placeholder per row) follows the cursor while it hovers the list (`quickTo` on x/y, .6s `power3`). The card scales and fades in, the image inside crossfades between rows, and the card tilts slightly (`rotation` from the cursor's x-velocity, clamped ±8°). Hide this on touch devices.

### 4.7 "IDEAS ARE HUMAN." plus founder (`#team`): **Devan's photo goes here**
- Pinned section (ScrollTrigger `pin:true`, `end:"+=150%"`, `scrub:1`).
- Big line **"IDEAS ARE HUMAN."** and the sub-line "Creative experience across brands, products, films and technology…" (placeholder).
- **Person media.** The reference uses a scroll-scrubbed founder video. Rebuild it from Devan's still photo `public/assets/person.jpg`:
  - Start as a small portrait card in the center (about 22vw wide, 4:5, rounded 4px). While the section is pinned, scrub `clipPath` from `inset(30% 35% 30% 35%)` to `inset(0)` and scale from 1.25 to 1, so the photo grows to full-bleed.
  - Add slow Ken Burns drift (`xPercent`/`yPercent` ±3) and a grain overlay (CSS SVG noise, 6% opacity) so the still feels like video.
  - Optional upgrade: if Devan later supplies a short clip, set `video.currentTime = progress * duration` in the ScrollTrigger `onUpdate` callback. The video must be encoded with keyframes every frame (`-g 1`) so scrubbing stays smooth.
  - Apply a `grayscale(1) contrast(1.05)` filter that lifts to color as the section progresses (if the reference portrait is monochrome, match it).
- Then, overlaid or beside it (unpinned):
  - Label **"FOUNDER / CREATIVE DIRECTOR"**
  - Name **"Your Name."** (display font, with the trailing period kept)
  - Stat **"X+ YEARS OF CREATIVE EXPERIENCE"**, with the number counting up from 0 when it enters view
  - Two short bio paragraphs (placeholder)
- **"SELECTED RECOGNITION"**: a numbered list (`01`–`03`) in the same row style as 4.6, with placeholder awards, followed by a small muted disclaimer line.
- Social links: LinkedIn · Instagram · Behance (placeholders `#`), with the text-roll hover from 4.1.

### 4.8 Contact (`#contact`)
- Huge **"LET'S MAKE IT `NAME`."**, the biggest type on the page after the hero.
- Email `hello@yourdomain.com` and phone `+00 000 000 000` as large links.
- Motion:
  - The headline chars rise in, staggered.
  - The email link is a **magnetic button**: within 120px of the cursor it pulls toward it (`quickTo` x/y with strength .35) and springs back with `elastic.out(1,.4)`.
  - A copy-to-clipboard toast says "COPIED".

### 4.9 Footer
- **"NAME / CREATIVE IDEAS & VISUAL PRODUCTION"** · **"BACK TO TOP ↑"** (Lenis `scrollTo(0, {duration:1.6})`) · **"© 2026 NAME"**.
- Optional big wordmark across the bottom edge, revealed by a parallax `yPercent 40→0` scrub.

### 4.10 Cookie banner
- Small card bottom-left: "Cookies" with a line of text and two buttons, **Reject** and **Accept**. It slides up 1.5s after load and saves the choice in `localStorage`.

### 4.11 Global extras (check each against phase 1; drop any the reference doesn't have)
- **Custom cursor:** a 10px dot plus a 40px ring that lags behind (`quickTo` .15s and .5s). It grows on links, shows "VIEW" or "PLAY" over media, and uses `mix-blend-mode: difference`. Off on touch.
- **Section color shifts:** if the background changes between sections, tween `--bg`/`--fg` with ScrollTrigger `onEnter`/`onLeaveBack`.
- **Marquee:** if any running text band exists, make it an infinite `xPercent:-50` loop over 20s whose speed and direction follow the scroll velocity.
- **Image reveals:** every non-hero image wipes in with `clipPath inset(0 0 100% 0) → inset(0)` and an inner scale from 1.3 to 1, over 1.2s `expo.out`.
- **Anchor links** scroll with Lenis `scrollTo(target, {offset:-80, duration:1.4})`.

---

## 5. Responsiveness
- Breakpoints: 1440, 1024, 768, 390. Check each one against the phase-1 screenshots.
- On mobile:
  - Turn off the floating preview, the cursor and the magnetic effects.
  - Shorten the founder pin to `+=80%`.
  - Hero titles keep at most 2 lines.
  - Service rows stack the number, the title and the description.
- No horizontal scroll at any width.

## 6. Performance and quality checks
- Animate only `transform`, `opacity` and `clip-path`. Never animate layout properties.
- Lazy-load the slide media. Serve images as AVIF/WebP. Preload the display font.
- Lighthouse performance ≥ 85 on mobile. Keep CLS low.
- Write `tests/compare.spec.js` (Playwright). It screenshots your build at the three viewports next to the `reference/screens` captures, so the layouts can be compared side by side (structure only, since the content differs).
- Accessibility: real `<nav>` and `<button>` elements, focus styles, `aria-live` on the slide counter, an overlay focus trap, and alt text on Devan's photo.

## 7. Where Devan puts their own content
| What | Where |
|---|---|
| Brand name, tagline, all headings and body text, services, awards, contact details, social links | `src/content.js` |
| Logo | `public/assets/logo.svg` (an SVG is best; it inherits `currentColor`) |
| **Your photo (the person)** | `public/assets/person.jpg`: at least 2000px tall, portrait 4:5, subject centered, plain or dark background |
| Hero slide media (5) | `public/assets/slides/01–05` (jpg or mp4, 1920×1080, muted loops under 4MB) |
| Service hover previews (7) | `public/assets/services/01–07.jpg` |
| Overlay video | `public/assets/overlay.mp4` |
| Colors and fonts | `src/styles/tokens.css` |
| Page title, description, OG image | `index.html` `<head>` and `public/assets/og.jpg` |

## 8. Definition of done
- [ ] Every section in section 4 is present, in the same order, with the same layout rhythm as the reference at all three viewports.
- [ ] Every animation in `reference/NOTES.md` is rebuilt with matching timing and easing (within about 10%).
- [ ] Devan's photo is used in the founder section with the scroll-grow effect.
- [ ] The build contains no assets, brand names, people or copy taken from the reference.
- [ ] `npm run build` produces a static `dist/` that can be deployed to Vercel or Netlify as-is.
