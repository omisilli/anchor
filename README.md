# anchor

Scrolling to a place on the page, straight from markup: to a section, the
top or the bottom, with a glide of a set length — the same with or without
Lenis. A back-to-top button that shows after a set scroll and steps out of
the way of marked areas, menus that mark the section you are in, tabs that
bring the reader back to the start of the one they open, and rows that
scroll sideways keeping their current item in view. One script, one
stylesheet, no dependencies, framework-agnostic.

```html
<a href="#contact" data-pg-anchor>Contact</a>
<div data-pg-anchor="#products">…a whole card…</div>

<button data-pg-anchor="top" data-pg-anchor-visible="false" aria-label="Back to top">↑</button>
```

```sh
npm install github:omisilli/anchor#v3.1.0
```

```ts
import { initAnchor } from "@plusguard/anchor";
import "@plusguard/anchor/index.css";

initAnchor();
```

Or from CSS, which lets you pick the cascade layer:

```css
@import "@plusguard/anchor/index.css" layer(components);
```

### Without a build step

Load both halves straight from jsDelivr — no install, and the page works
when opened by double-clicking:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/omisilli/anchor@v3.1.0/index.css" />

<script type="module">
    import { initAnchor } from "https://cdn.jsdelivr.net/gh/omisilli/anchor@v3.1.0/dist/index.js";

    initAnchor();
</script>
```

Pin the version (`@v3.1.0`) on a live site. A pinned URL never changes;
`@3` follows the newest 3.x release.

## Who does what

A plain `<a href="#contact">` already scrolls, and two lines of CSS make it
smooth and keep it clear of a fixed header. Use those wherever they are
enough; this package is for the rest.

| Need                                        | Browser / Lenis alone                              | anchor                                            |
| ------------------------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| Smooth scroll to `#id`                      | `scroll-behavior: smooth`, or Lenis `anchors`      | ✓                                                 |
| Clear a fixed header                        | `scroll-padding-top` / `scroll-margin-top`         | ✓ reads the same CSS, plus `--pg-anchor-edge`     |
| How long the scroll takes                   | the browser decides; Lenis only                    | ✓ `--pg-anchor-duration`, per screen size, with or without Lenis |
| A `<div>` or a `<button>` that scrolls      | —                                                  | ✓ made reachable by keyboard too                  |
| Keep the address bar as it is               | — the `#id` is always written                      | ✓ `data-pg-anchor-hash`, either way               |
| Stop when the user scrolls mid-way          | Lenis only                                         | ✓                                                 |
| Show a button after some scrolling          | —                                                  | ✓ `data-pg-anchor-visible`                        |
| Keep it off the footer and other areas      | —                                                  | ✓ `data-pg-anchor-avoid`: step aside, or pass under |
| Mark the menu link of the current section   | —                                                  | ✓ `data-pg-anchor-spy`, any number of menus       |
| Only back up to a tab's start, never down   | —                                                  | ✓ `--pg-anchor-when: passed`, per screen size     |
| Keep an accordion's question in place while the answer above closes | `overflow-anchor`, which picks the closing answer itself | ✓ `data-pg-anchor-stay`, any animation |
| Keep a sideways row's current item in view  | `scrollIntoView`, by hand, on every change         | ✓ `data-pg-anchor-strip`: centred, its own speed  |

## Files

| File              | For                                                              |
| ----------------- | ---------------------------------------------------------------- |
| `index.ts`        | TypeScript source — import it directly in a TS / bundler project |
| `index.css`       | The CSS half: the lengths, hiding, stepping aside, passing under |
| `dist/index.js`   | Compiled ES module — plain HTML, no build step                   |
| `dist/index.d.ts` | Types for `dist/index.js`                                        |

Importing `dist/index.js` from your own files? Serve the page over HTTP —
browsers block module imports on `file://`.

`dist/` is committed. After editing `index.ts`, rebuild it:

```sh
npx -p typescript tsc index.ts --outDir dist --declaration --target es2020 --module es2020 --lib dom,es2020 --strict
```

## Attributes

| Attribute                    | On                       | Meaning                                                                 |
| ---------------------------- | ------------------------ | ----------------------------------------------------------------------- |
| `data-pg-anchor`             | anything clickable       | The target: `"#id"`, `"top"` or `"bottom"`. On a link, empty: its `#hash` |
| `data-pg-anchor-hash`        | it, or anything above    | `"true"` writes `#id` to the address bar; `"false"` (default) does not  |
| `data-pg-anchor-visible`     | a floating element       | Write `"false"`; anchor sets `"true"` once the page has scrolled enough |
| `data-pg-anchor-avoid`       | an area                  | Floating elements step out of its way; `"hide"`: they pass under it     |
| `data-pg-anchor-spy`         | a menu                   | Its links mark the section you are in                                   |
| `data-pg-anchor-strip`       | a row that scrolls sideways | Keeps its current item in view                                       |
| `data-pg-anchor-stay`        | an accordion, or any box | The item clicked keeps its place on screen while the page above changes |
| `data-pg-anchor-covered`     | a floating element       | `"true"` while wholly under a `"hide"` area, written by anchor          |
| `data-pg-anchor-current`     | a link in a spy menu     | `"true"` or `"false"`, written by anchor                                |

"It, or anything above": the nearest one wins, so a value on `<body>` is
the site's default and a single link can still set its own.

```html
<body data-pg-anchor-hash="true">
    …
    <a href="#prices" data-pg-anchor data-pg-anchor-hash="false">Prices</a>
</body>
```

## CSS variables

Whatever changes with the screen is CSS, not an attribute — no pixels and
no media queries in the markup. Set them on the element or anywhere above
it, in media queries or with Tailwind's `md:[--…]`; `1rem`, `100svh` and
`calc()` all work.

| Variable                      | Default  | Meaning                                                               |
| ----------------------------- | -------- | --------------------------------------------------------------------- |
| `--pg-anchor-duration`        | `1200ms` | On a link: how long the page glides; `0s` jumps                       |
| `--pg-anchor-easing`          | Lenis's curve | On a link: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out` or `cubic-bezier(…)` |
| `--pg-anchor-edge`            | `0px`    | Extra room above a section it lands on                                |
| `--pg-anchor-show-after`      | `400px`  | How far the page scrolls before a `data-pg-anchor-visible` element shows |
| `--pg-anchor-avoid-space`     | `0px`    | The gap kept from an avoided area                                     |
| `--pg-anchor-avoid`           | `auto`   | On a floating element: `none` ignores avoided areas                   |
| `--pg-anchor-when`            | `always` | On a link: when a click scrolls — `always`, `passed`, `never`         |
| `--pg-anchor-stay`            | `auto`   | Inside a stay box: `none` lets the item clicked move                  |
| `--pg-anchor-strip`           | `center` | On a strip: where its current item goes — `center`, `start`, `end`, `none` |
| `--pg-anchor-strip-duration`  | `500ms`  | On a strip: how long it slides; `0s` is at once                       |
| `--pg-anchor-strip-easing`    | Lenis's curve | On a strip: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out` or `cubic-bezier(…)` |

anchor writes these, to read in your CSS:

| Variable                                | On                 | Meaning                                       |
| --------------------------------------- | ------------------ | --------------------------------------------- |
| `--pg-anchor-current-left` / `-top`     | a spy menu         | Where the current link sits inside the menu   |
| `--pg-anchor-current-width` / `-height` | a spy menu         | Its size — `0px` when no section is current   |
| `--pg-anchor-lift`                      | a floating element | How far it stepped aside (used by `index.css`) |
| `--pg-anchor-clip`                      | a floating element | The part a `"hide"` area covers (used by `index.css`) |

## Where a section lands

**Plain CSS first.** A section lands below the page's `scroll-padding-top`
and its own `scroll-margin-top` — the same rules the browser uses for a
plain `#link`, so both kinds of link land in the same place. Clear a fixed
header there, per screen size:

```css
:root {
    scroll-padding-top: 4.5rem; /* the header on phones, and some room */
}
@media (width >= 48rem) {
    :root {
        scroll-padding-top: 5.5rem;
    }
}
```

Or per section — handy when only part of the page has a sticky header:

```html
<section id="prices" class="scroll-mt-20 md:scroll-mt-28">…</section>
```

**Special cases: `--pg-anchor-edge`.** Room added on top of the CSS above,
on the clicked element or anything above it — one link that should land a
little lower than the rest:

```html
<button data-pg-anchor="#prices" style="--pg-anchor-edge: 3rem">Prices</button>
```

## The glide

anchor scrolls frame by frame for `--pg-anchor-duration` — `1200ms` by
default — on `--pg-anchor-easing`, by default Lenis's curve: off fast,
then a long soft landing. The user's wheel, a touch or a key stops it. With
reduced motion asked for, it jumps.

Both are CSS, on the link or anywhere above it: the site's default on
`:root`, a single link its own, and a phone its own in a media query.

```css
:root {
    --pg-anchor-duration: 1.9s;
}
@media (width < 48rem) {
    :root {
        --pg-anchor-duration: 1.2s; /* a shorter page, a shorter glide */
    }
}
```

```html
<button data-pg-anchor="#prices" style="--pg-anchor-duration: 400ms">Prices</button>
<a href="#contact" data-pg-anchor class="[--pg-anchor-easing:ease-in-out]">Contact</a>
```

A click that also closes a menu (an off-canvas sidebar locking the page)
is fine: the scroll starts a frame later, after the menu has let go.

### With Lenis

Hand Lenis in, and Lenis glides instead — the same duration and curve,
handed to it:

```ts
import Lenis from "lenis";
import { initAnchor, setAnchorScroller } from "@plusguard/anchor";

const lenis = new Lenis({ autoRaf: true });

initAnchor();
setAnchorScroller((top, ms, easing) =>
    lenis.scrollTo(top, ms ? { duration: ms / 1000, easing } : { immediate: true }),
);
```

`anchorEasing`, Lenis's curve, is exported too.

`setAnchorScroller(null)` goes back to the built-in glide. Leave Lenis's
own `anchors` option off — both would scroll on the same click.

## The address bar

By default the address is left as it is, as the old theme did.
`data-pg-anchor-hash="true"` writes `#id` instead — the link can be shared,
and Back returns to where you were; `top` and `bottom` clear the hash. Set
it on one link, or on `<body>` for all of them.

## Back to top

```html
<button
    class="up"
    data-pg-anchor="top"
    data-pg-anchor-visible="false"
    aria-label="Back to top"
>↑</button>

<div class="band" data-pg-anchor-avoid="hide">…</div>
<footer data-pg-anchor-avoid>…</footer>
```

```css
.up {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    transition: opacity 0.3s, visibility 0.3s;
    --pg-anchor-show-after: 100svh; /* after one screen */
    --pg-anchor-avoid-space: 1rem;
}
@media (width >= 48rem) {
    .up {
        right: 1.75rem;
        bottom: 1.75rem;
        --pg-anchor-show-after: 600px;
    }
}
```

- **Showing.** `data-pg-anchor-visible` turns `"true"` once the page has
  scrolled `--pg-anchor-show-after`. `index.css` hides the `"false"` state
  at zero weight — add your own transition to fade it.
- **Stepping aside — `data-pg-anchor-avoid`.** When the area reaches it,
  it moves to that area's edge and keeps `--pg-anchor-avoid-space`: up when
  it sits in the lower half of the screen, down in the upper. Areas back to
  back are cleared together. It moves with the `translate` property, so
  your `bottom` and any `transform` are kept. An area taller than the
  screen cannot be stepped around — the element stays on screen over it.
- **Passing under — `data-pg-anchor-avoid="hide"`.** It stays where it is
  and goes under the area: the part the area covers is cut off
  (`clip-path`), so it slides in at one edge and comes out at the other.
  Wholly under, it gets `data-pg-anchor-covered="true"` and is out of reach
  of Tab and clicks.
- **Which one.** Stepping aside suits areas at the end of the page, such as
  the footer: they never pass by. An area in the middle of the page does
  pass by — once its lower edge has gone above the element, the element
  drops back down by the area's height in one go. Mid-page, passing under
  is smoother.
- **Per screen size: `--pg-anchor-avoid`.** `none` on the element turns
  both off — in a media query, for one screen size:
  `@media (width < 62rem) { .up { --pg-anchor-avoid: none } }` avoids on
  wide screens only.

Any fixed element can float this way, not only a back-to-top button; give
it `data-pg-anchor-visible` and a `--pg-anchor-show-after` of `0px` to
have it always shown.

## Menus that follow along

```html
<nav class="menu" data-pg-anchor-spy>
    <a href="#about" data-pg-anchor>About</a>
    <a href="#work" data-pg-anchor>Work</a>
    <span class="marker" aria-hidden="true"></span>
</nav>
```

```css
.menu {
    position: relative; /* or sticky / fixed */
}
.menu [data-pg-anchor-current="true"] {
    color: black;
}
.menu .marker {
    position: absolute;
    bottom: 0;
    left: var(--pg-anchor-current-left);
    width: var(--pg-anchor-current-width);
    height: 2px;
    background: black;
    transition: left 0.3s, width 0.3s;
}
```

- A section is current once its top has reached the line it would land on
  — so after a click, the link you clicked is the one marked. At the very
  bottom of the page, the last section on screen is marked even if it
  never reached that line.
- **Any number of menus.** Each `data-pg-anchor-spy` follows on its own: a
  header menu and a phone's sidebar with the same links are both marked,
  each styled its own way.
- The current link also gets `aria-current="location"`.
- A vertical list uses `--pg-anchor-current-top` and `-height` instead.

## Tabs

A tab bar, with the targetFunctions package opening one tab at a time and
anchor doing the scrolling. Each tab is a link to its panel:

```html
<div class="tabs">
    <nav class="tab-list" data-pg-anchor-strip>
        <a href="#t-policies" data-pg-anchor data-pg-target-functions="close-tab-except-t1 open-t1">Policies</a>
        <a href="#t-notices"  data-pg-anchor data-pg-target-functions="close-tab-except-t3 open-t3">Notices</a>
    </nav>
    <div id="t-policies" data-pg-target="t1 tab" data-pg-target-active="true">…a long tab…</div>
    <div id="t-notices"  data-pg-target="t3 tab" data-pg-target-active="false">…a short one…</div>
</div>
```

```css
.tabs {
    --pg-anchor-when: passed;
}
.tab-list {
    position: sticky; /* the bar follows the reader down — no script */
    top: var(--header);
    display: flex;
    overflow-x: auto;
}
.tabs [data-pg-target] {
    /* The bar's height: a panel lands below it, and below the header that
       the page's scroll-padding-top already clears. */
    scroll-margin-top: 3rem;
}
.tabs [data-pg-target-active="false"] {
    display: none;
}
```

**Why `passed`.** Read to the end of a long tab, press a short one on the
sticky bar: the page is suddenly much shorter, and the reader is left where
the long tab ended — the footer, or the next section — with the tab they
asked for somewhere above. `passed` brings them back to its start. Only
back up: at the start of the tabs, or above them, nothing moves — a tab
pressed there never drags the page down to itself.

| `--pg-anchor-when` | A click…                                                      |
| ------------------ | ------------------------------------------------------------- |
| `always` (default) | scrolls to the target, up or down                             |
| `passed`           | scrolls only up, to a target the reader has scrolled past     |
| `never`            | does not scroll — the address is still written, if asked      |

It works the same on a computer as on a phone. For one screen size only, a
media query: `@media (width >= 62rem) { .tabs { --pg-anchor-when: never } }`.

**The address.** By default it is left as it is. With
`data-pg-anchor-hash="true"` on the tabs, a tab writes its panel's `#id`;
opening that address opens that tab — targetFunctions reads it — and Back
goes back to the tab before. Either way, as you like.

**The bar** is a strip: on a phone, the tab pressed slides to the middle
(next section).

## Accordions — the question stays put

One answer at a time: pressing a question closes the open answer. When
that answer is above the question, everything below it rides up as it
closes — the question pressed too, off the top of a phone's screen if the
answer was long. The reader is left looking at whatever came after.

```html
<div class="acc" data-pg-anchor-stay>
    <button data-pg-target-functions="close-faq-except-q1 toggle-q1">…</button>
    <div data-pg-target="q1 faq" data-pg-target-active="false">…</div>
    <button data-pg-target-functions="close-faq-except-q2 toggle-q2">…</button>
    <div data-pg-target="q2 faq" data-pg-target-active="false">…</div>
</div>
```

With `data-pg-anchor-stay`, the question pressed keeps its place on the
screen: the page scrolls by exactly what it would have moved, frame by
frame, for as long as it moves. The answer above slides out of the top of
the screen; the question, and its answer opening below it, stay where the
reader is looking.

- **Any animation.** It measures every frame instead of knowing the
  transition — any length, any curve, or none.
- **Only what is above.** An answer closing below the question moves
  nothing on screen, so there is nothing to hold.
- **Until it settles.** It lets go once the question has been still for a
  moment, or when the user turns the wheel, touches or presses a key.
- **At the very top** the page cannot scroll any further up: the question
  moves by what is left.
- **Per screen size:** `--pg-anchor-stay: none` in a media query turns it
  off there — on a phone where every answer may stay open, nothing above
  ever closes anyway.
- **Not on links that scroll.** An item with `data-pg-anchor` scrolls the
  page itself; it is left to that.

The box can be anything that holds the clickable items — an accordion, a
footer's columns, a list whose rows expand. Tabs are the other case: there
the bar is sticky and does not move, and the content changes at once —
`--pg-anchor-when: passed` (above) brings the reader to the new tab's
start.

## Strips — rows that scroll sideways

A tab bar, a row of chips, a header menu on a phone: anything that scrolls
sideways. `data-pg-anchor-strip` keeps its current item in view:

- **Which item.** The one marked `aria-current` (a spy's current link),
  `aria-selected="true"` or `aria-expanded="true"` (a targetFunctions tab).
  If nothing in the row is marked, the one clicked.
- **Where.** `--pg-anchor-strip: center`, the default — and at the ends it
  simply stops: the first items stay at the start, the last at the end,
  only those in between are centred, so there is always something to see
  on both sides. `start` puts the item at the row's start (and its
  `scroll-padding-left`), `end` at its end, `none` leaves the row alone.
- **How.** `--pg-anchor-strip-duration` (`500ms`; `0s` at once) and
  `--pg-anchor-strip-easing`. With reduced motion asked for, it is at once;
  the user's own wheel, touch or press on the row stops it.
- **On load,** the current item is put in view at once — a page opened on
  the fourth tab shows the fourth tab in the bar.
- **Only the row moves**, never the page.
- **Edge to edge.** A row inside the page's gutter is cut off short of the
  screen's side, and a scrolled item seems to vanish into a gap. Step it
  out of the gutter, and put its first item back in line with padding;
  `scroll-padding` does the same for `start` and `end`:

  ```css
  .tab-list {
      margin-inline: -1rem; /* the page's gutter */
      padding-inline: 1rem;
      scroll-padding-inline: 1rem;
  }
  ```

```css
.tab-list {
    --pg-anchor-strip-duration: 300ms;
    --pg-anchor-strip-easing: ease-out;
}
@media (width >= 62rem) {
    .tab-list {
        --pg-anchor-strip: none; /* wide enough for every tab */
    }
}
```

A spy menu can be a strip too — `data-pg-anchor-spy data-pg-anchor-strip`:
on a phone, the link to the section you are in stays in view as you read.

## Keyboard and screen readers

A `<p>` or `<div>` with `data-pg-anchor` gets `tabindex="0"` and
`role="link"` (unless it has its own), and Enter presses it. After a
keyboard press, focus moves to the section — Tab carries on from there,
as it would after a real jump. Not with `passed`: that is no jump, only the
start of what is being read brought back — focus stays on the tab. Prefer `<a href="#id">` where you can: it
also works before the script has loaded.

A Cmd- or Ctrl-click on a link is left to the browser — it opens a tab.

Without JavaScript, links with an `href` still jump, and nothing is hidden.

## From the old scripts

| Before (quaSmoothScroll, quaSmoothScrollUpVisibility, smoothScroll.js) | Now                                                        |
| ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| `data-qua-smoothScroll="#id"` / `"top"`                                | `data-pg-anchor="#id"` / `"top"`                           |
| Lenis-only: nothing happened without `window.lenis`                    | Its own glide; Lenis through `setAnchorScroller`           |
| jQuery `animate`, 500 / 750 ms                                         | `--pg-anchor-duration`, in both modes                      |
| Header height − 30px, measured                                         | `scroll-padding-top` / `scroll-margin-top`, `--pg-anchor-edge` |
| `qua-active` after 400px                                               | `data-pg-anchor-visible`, `--pg-anchor-show-after`         |
| `data-qua-smoothScrollSpace`, footer only, desktop only                | `data-pg-anchor-avoid` (or `="hide"`) on any area, `--pg-anchor-avoid-space`, `--pg-anchor-avoid` |
| "Scroll Color Switch" and `.qua-slider`                                | `data-pg-anchor-spy`, `--pg-anchor-current-*`              |
| `qua-tabClickSmooth.js`: back to the tab's top below 992px, header measured | `--pg-anchor-when: passed` — every screen, or per media query |
| `qua-tabStickyScroll.js`: a class added on scroll                      | `position: sticky` — CSS alone                             |

## Upgrading from 2.x

The glide's length moved into CSS, beside the strip's: it changes per
screen size now, and has an easing.

```html
<!-- 2.x -->
<body data-pg-anchor-duration="1900">
<button data-pg-anchor="#prices" data-pg-anchor-duration="400">
```

```html
<!-- 3.x -->
<body style="--pg-anchor-duration: 1.9s">   <!-- or :root in your CSS -->
<button data-pg-anchor="#prices" style="--pg-anchor-duration: 400ms">
```

With Lenis, take the easing your scroller is now handed —
`(top, ms, easing) => lenis.scrollTo(top, { duration: ms / 1000, easing })` —
so `--pg-anchor-easing` reaches Lenis too. A scroller that ignores it keeps
working, on its own curve.

## Upgrading from 1.x

`data-pg-anchor-avoid-media` is gone: a screen size belongs in CSS. Move it
into a media query, inverted — it said where to avoid, the variable says
where not to:

```html
<!-- 1.x -->
<button class="up" data-pg-anchor-avoid-media="(width >= 62rem)" …>
```

```css
/* 2.x */
@media (width < 62rem) {
    .up {
        --pg-anchor-avoid: none;
    }
}
```

Everything else is as it was; `--pg-anchor-when` and strips are new.

## React

Call `initAnchor` once, in an effect — it returns its own cleanup:

```tsx
useEffect(() => initAnchor(), []);
```

The links and sections need no client code — tabs and strips included. A bare `data-pg-anchor` in JSX
is fine: React writes it as `"true"`, which counts as empty. JSX sets the
starting `data-pg-anchor-visible="false"` and must not change it
afterwards; from then on anchor owns it.

With `lenis/react`, hand Lenis in from inside `<ReactLenis>`:

```tsx
const lenis = useLenis();
useEffect(() => {
    if (!lenis) return;
    setAnchorScroller((top, ms, easing) =>
        lenis.scrollTo(top, ms ? { duration: ms / 1000, easing } : { immediate: true }),
    );
    return () => setAnchorScroller(null);
}, [lenis]);
```

If `initAnchor` is called again before the first cleanup runs (React
remounting in development), only the newest call answers.

See [`examples/react/Example.tsx`](examples/react/Example.tsx). A plain HTML
version, with every case above and a `?lenis` switch, is in
[`examples/static/index.html`](examples/static/index.html) — an accordion
whose question stays (or, switched off, rides up), and tabs that have
switches for `passed`, `always` and `never` (read to the end of the long
tab, press the short one), for the address, and for the strip's place and
speed; narrow the window for the strips.
