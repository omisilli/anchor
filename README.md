# anchor

Scrolling to a place on the page, straight from markup: to a section, the
top or the bottom, with a glide of a set length — the same with or without
Lenis. A back-to-top button that shows after a set scroll and steps out of
the way of marked areas, and menus that mark the section you are in. One
script, one stylesheet, no dependencies, framework-agnostic.

```html
<a href="#contact" data-pg-anchor>Contact</a>
<div data-pg-anchor="#products">…a whole card…</div>

<button data-pg-anchor="top" data-pg-anchor-visible="false" aria-label="Back to top">↑</button>
```

```sh
npm install github:omisilli/anchor#v1.0.0
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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/omisilli/anchor@v1.0.0/index.css" />

<script type="module">
    import { initAnchor } from "https://cdn.jsdelivr.net/gh/omisilli/anchor@v1.0.0/dist/index.js";

    initAnchor();
</script>
```

Pin the version (`@v1.0.0`) on a live site. A pinned URL never changes;
`@1` follows the newest 1.x release.

## Who does what

A plain `<a href="#contact">` already scrolls, and two lines of CSS make it
smooth and keep it clear of a fixed header. Use those wherever they are
enough; this package is for the rest.

| Need                                        | Browser / Lenis alone                              | anchor                                            |
| ------------------------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| Smooth scroll to `#id`                      | `scroll-behavior: smooth`, or Lenis `anchors`      | ✓                                                 |
| Clear a fixed header                        | `scroll-padding-top` / `scroll-margin-top`         | ✓ reads the same CSS, plus `--pg-anchor-edge`     |
| How long the scroll takes                   | the browser decides; Lenis only                    | ✓ `data-pg-anchor-duration`, with or without Lenis |
| A `<div>` or a `<button>` that scrolls      | —                                                  | ✓ made reachable by keyboard too                  |
| Keep the address bar as it is               | — the `#id` is always written                      | ✓ `data-pg-anchor-hash`, either way               |
| Stop when the user scrolls mid-way          | Lenis only                                         | ✓                                                 |
| Show a button after some scrolling          | —                                                  | ✓ `data-pg-anchor-visible`                        |
| Keep it off the footer and other areas      | —                                                  | ✓ `data-pg-anchor-avoid`                          |
| Mark the menu link of the current section   | —                                                  | ✓ `data-pg-anchor-spy`, any number of menus       |

## Files

| File              | For                                                              |
| ----------------- | ---------------------------------------------------------------- |
| `index.ts`        | TypeScript source — import it directly in a TS / bundler project |
| `index.css`       | The CSS half: the lengths, hiding, stepping aside                |
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
| `data-pg-anchor-duration`    | it, or anything above    | The glide, in ms. Default `1200`; `0` jumps                             |
| `data-pg-anchor-hash`        | it, or anything above    | `"true"` writes `#id` to the address bar; `"false"` (default) does not  |
| `data-pg-anchor-visible`     | a floating element       | Write `"false"`; anchor sets `"true"` once the page has scrolled enough |
| `data-pg-anchor-avoid`       | an area                  | Floating elements step out of its way                                   |
| `data-pg-anchor-avoid-media` | a floating element       | A media query: avoid only where it matches. Default: everywhere         |
| `data-pg-anchor-spy`         | a menu                   | Its links mark the section you are in                                   |
| `data-pg-anchor-current`     | a link in a spy menu     | `"true"` or `"false"`, written by anchor                                |

"It, or anything above": the nearest one wins, so a value on `<body>` is
the site's default and a single link can still set its own.

```html
<body data-pg-anchor-duration="1900">
    …
    <button data-pg-anchor="#prices" data-pg-anchor-duration="400">Prices</button>
</body>
```

## CSS variables

Lengths are CSS, not attributes, because they change with the screen.
Set them anywhere above the element, in media queries or with Tailwind's
`md:[--…]`; `1rem`, `100svh` and `calc()` all work.

| Variable                  | Default | Meaning                                                               |
| ------------------------- | ------- | --------------------------------------------------------------------- |
| `--pg-anchor-edge`        | `0px`   | Extra room above a section it lands on                                |
| `--pg-anchor-show-after`  | `400px` | How far the page scrolls before a `data-pg-anchor-visible` element shows |
| `--pg-anchor-avoid-space` | `0px`   | The gap kept from an avoided area                                     |

anchor writes these, to read in your CSS:

| Variable                                | On                 | Meaning                                       |
| --------------------------------------- | ------------------ | --------------------------------------------- |
| `--pg-anchor-current-left` / `-top`     | a spy menu         | Where the current link sits inside the menu   |
| `--pg-anchor-current-width` / `-height` | a spy menu         | Its size — `0px` when no section is current   |
| `--pg-anchor-lift`                      | a floating element | How far it stepped aside (used by `index.css`) |

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

anchor scrolls frame by frame on Lenis's curve — off fast, then a long soft
landing — for `data-pg-anchor-duration` ms. The user's wheel, a touch or a
key stops it. With reduced motion asked for, it jumps.

A click that also closes a menu (an off-canvas sidebar locking the page)
is fine: the scroll starts a frame later, after the menu has let go.

### With Lenis

Hand Lenis in, and Lenis glides instead — same duration, same curve:

```ts
import Lenis from "lenis";
import { initAnchor, setAnchorScroller, anchorEasing } from "@plusguard/anchor";

const lenis = new Lenis({ autoRaf: true });

initAnchor();
setAnchorScroller((top, ms) =>
    lenis.scrollTo(top, ms ? { duration: ms / 1000, easing: anchorEasing } : { immediate: true }),
);
```

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

<div class="band" data-pg-anchor-avoid>…</div>
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
- **Stepping aside.** When an avoided area passes under it, it moves to
  that area's edge and keeps `--pg-anchor-avoid-space`: up when it sits in
  the lower half of the screen, down in the upper. Areas back to back are
  cleared together. `data-pg-anchor-avoid-media="(width >= 62rem)"` limits
  this to wide screens.
- It moves with the `translate` property, so your `bottom` and any
  `transform` are kept. An area taller than the screen cannot be stepped
  around — the element stays on screen over it.

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

## Keyboard and screen readers

A `<p>` or `<div>` with `data-pg-anchor` gets `tabindex="0"` and
`role="link"` (unless it has its own), and Enter presses it. After a
keyboard press, focus moves to the section — Tab carries on from there,
as it would after a real jump. Prefer `<a href="#id">` where you can: it
also works before the script has loaded.

A Cmd- or Ctrl-click on a link is left to the browser — it opens a tab.

Without JavaScript, links with an `href` still jump, and nothing is hidden.

## From the old scripts

| Before (quaSmoothScroll, quaSmoothScrollUpVisibility, smoothScroll.js) | Now                                                        |
| ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| `data-qua-smoothScroll="#id"` / `"top"`                                | `data-pg-anchor="#id"` / `"top"`                           |
| Lenis-only: nothing happened without `window.lenis`                    | Its own glide; Lenis through `setAnchorScroller`           |
| jQuery `animate`, 500 / 750 ms                                         | `data-pg-anchor-duration`, in both modes                   |
| Header height − 30px, measured                                         | `scroll-padding-top` / `scroll-margin-top`, `--pg-anchor-edge` |
| `qua-active` after 400px                                               | `data-pg-anchor-visible`, `--pg-anchor-show-after`         |
| `data-qua-smoothScrollSpace`, footer only, desktop only                | `data-pg-anchor-avoid` on any area, `--pg-anchor-avoid-space`, `data-pg-anchor-avoid-media` |
| "Scroll Color Switch" and `.qua-slider`                                | `data-pg-anchor-spy`, `--pg-anchor-current-*`              |

## React

Call `initAnchor` once, in an effect — it returns its own cleanup:

```tsx
useEffect(() => initAnchor(), []);
```

The links and sections need no client code. A bare `data-pg-anchor` in JSX
is fine: React writes it as `"true"`, which counts as empty. JSX sets the
starting `data-pg-anchor-visible="false"` and must not change it
afterwards; from then on anchor owns it.

With `lenis/react`, hand Lenis in from inside `<ReactLenis>`:

```tsx
const lenis = useLenis();
useEffect(() => {
    if (!lenis) return;
    setAnchorScroller((top, ms) =>
        lenis.scrollTo(top, ms ? { duration: ms / 1000, easing: anchorEasing } : { immediate: true }),
    );
    return () => setAnchorScroller(null);
}, [lenis]);
```

If `initAnchor` is called again before the first cleanup runs (React
remounting in development), only the newest call answers.

See [`examples/react/Example.tsx`](examples/react/Example.tsx). A plain HTML
version, with every case above and a `?lenis` switch, is in
[`examples/static/index.html`](examples/static/index.html).
