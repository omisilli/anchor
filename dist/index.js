/*
 * anchor — scrolling to a place on the page, from markup.
 *
 *   <a href="#contact" data-pg-anchor>Contact</a>
 *   <div data-pg-anchor="#products">…a whole card…</div>
 *   <button data-pg-anchor="top" data-pg-anchor-visible="false">↑</button>
 *
 * data-pg-anchor is the target: "#id", "top" or "bottom". On a link it may
 * be left empty — the target is then the link's own #hash, on this page.
 *
 * Options, on the element or anywhere above it (the nearest wins):
 *   data-pg-anchor-hash       "true" writes #id to the address bar; "false",
 *                             the default, leaves the address as it is
 *
 * The glide is CSS, so it changes per screen size (index.css):
 *   --pg-anchor-duration      a time. Default 1200ms; 0s is a jump
 *   --pg-anchor-easing        linear, ease…, cubic-bezier(…). Default: the
 *                             curve below, Lenis's own
 *
 * When it scrolls: --pg-anchor-when on the element or above (index.css) —
 * "always" (default); "passed", only back up to a section the reader has
 * scrolled past — a tab bar's "start of the new tab" — never down; "never".
 * A CSS variable, so it changes per screen size.
 *
 * Where a section lands: below the page's scroll-padding-top, its own
 * scroll-margin-top and --pg-anchor-edge (index.css) — a fixed header is
 * cleared with those, per screen size through media queries.
 *
 * The glide runs frame by frame, in both modes; the
 * user's wheel, touch or keys stop it, and with reduced motion asked for it
 * is a jump. On a page with Lenis, hand Lenis in with setAnchorScroller.
 *
 * Showing: an element with data-pg-anchor-visible (write "false" to start)
 * turns "true" once the page has scrolled --pg-anchor-show-after. It also
 * keeps clear of data-pg-anchor-avoid areas, unless its --pg-anchor-avoid
 * is "none" (per screen size, in a media query):
 *   data-pg-anchor-avoid          it steps out of the way — up when it sits
 *                                 in the lower half of the screen, down in
 *                                 the upper — keeping --pg-anchor-avoid-space
 *   data-pg-anchor-avoid="hide"   it passes under: the part the area covers
 *                                 is cut off; wholly under, it gets
 *                                 data-pg-anchor-covered="true"
 *
 * Spy: in a data-pg-anchor-spy menu, the links whose section has reached
 * the landing line get data-pg-anchor-current="true" and
 * aria-current="location"; the menu gets --pg-anchor-current-left / -top /
 * -width / -height, for a marker that slides under the current link.
 *
 * Strip: a data-pg-anchor-strip row that scrolls sideways (tabs, chips, a
 * spy menu) keeps its current item in view — the one marked aria-current,
 * aria-selected="true" or aria-expanded="true" — and, if none is marked,
 * the one clicked. --pg-anchor-strip: center (default; at the ends it
 * simply stops), start, end or none; --pg-anchor-strip-duration and
 * --pg-anchor-strip-easing for the slide. Only the row moves, never the
 * page. On load the current item is put in view at once.
 *
 * Stay: inside a data-pg-anchor-stay box (an accordion), the item clicked
 * keeps its place on the screen while the page above it changes — an
 * answer closing above the question just opened, however it animates. The
 * page scrolls by what the item would have moved, frame by frame, until it
 * has been still a while; the user's wheel, touch or keys stop it.
 * --pg-anchor-stay: none turns it off, per screen size.
 *
 * A <p> or <div> with data-pg-anchor is made reachable: tabindex="0",
 * role="link", and Enter.
 */
const ATTR = "data-pg-anchor";
const HASH = "data-pg-anchor-hash";
const VISIBLE = "data-pg-anchor-visible";
const AVOID = "data-pg-anchor-avoid";
const SPY = "data-pg-anchor-spy";
const CURRENT = "data-pg-anchor-current";
const COVERED = "data-pg-anchor-covered";
const STRIP = "data-pg-anchor-strip";
const STAY = "data-pg-anchor-stay";
const LIFT = "--pg-anchor-lift";
const CLIP = "--pg-anchor-clip";
const DEFAULT_DURATION = 1200;
const DEFAULT_SHOW_AFTER = 400;
const DEFAULT_STRIP_DURATION = 500;
/* What a strip keeps in view: an item marked as the current one. */
const MARKED = '[aria-current]:not([aria-current="false"]), [aria-selected="true"], [aria-expanded="true"]';
/* What a click in a strip lands on, when nothing is marked. */
const ITEM = "a, button, [role='tab'], [tabindex], [data-pg-anchor]";
/* Lenis's own curve: off fast, then a long soft landing. */
export const anchorEasing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
let scroller = null;
/*
 * With Lenis, hand it in; null goes back to the built-in glide.
 *
 *   setAnchorScroller((top, ms, easing) =>
 *       lenis.scrollTo(top, ms ? { duration: ms / 1000, easing } : { immediate: true }));
 */
export function setAnchorScroller(next) {
    stopGlide();
    scroller = next;
}
function px(value) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : 0;
}
function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - innerHeight);
}
function option(el, attr) {
    return el.closest(`[${attr}]`)?.getAttribute(attr) ?? null;
}
/* A keyword CSS variable: one of `values`, else the first of them. */
function keyword(el, name, values) {
    const raw = getComputedStyle(el).getPropertyValue(name).trim();
    return values.includes(raw) ? raw : values[0];
}
function reducedMotion() {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/* ---------- The glide ---------- */
let glide = 0;
const STOPPERS = ["wheel", "touchstart", "keydown", "pointerdown"];
function stopGlide() {
    if (!glide)
        return;
    cancelAnimationFrame(glide);
    glide = 0;
    STOPPERS.forEach((type) => removeEventListener(type, stopGlide));
}
function glideTo(top, duration, easing) {
    stopGlide();
    const from = scrollY;
    // "instant" on every step: a page-wide scroll-behavior: smooth would
    // otherwise turn each one into a smooth scroll of its own.
    if (duration <= 0 || Math.abs(top - from) < 1) {
        scrollTo({ top, behavior: "instant" });
        return;
    }
    const start = performance.now();
    const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        scrollTo({ top: from + (top - from) * easing(t), behavior: "instant" });
        if (t < 1)
            glide = requestAnimationFrame(step);
        else
            stopGlide();
    };
    STOPPERS.forEach((type) => addEventListener(type, stopGlide, { passive: true }));
    glide = requestAnimationFrame(step);
}
/* ---------- Targets ---------- */
function isLink(el) {
    return el instanceof HTMLAnchorElement && el.hasAttribute("href");
}
function targetOf(el) {
    const value = el.getAttribute(ATTR);
    // JSX writes a bare data-pg-anchor as "true": same as empty.
    if (value && value !== "true")
        return value;
    // An empty value on a link: its #hash — but only for this page.
    if (isLink(el) && el.host === location.host && el.pathname === location.pathname)
        return el.hash;
    return "";
}
function sectionOf(target) {
    if (!target.startsWith("#") || target.length < 2)
        return null;
    return document.getElementById(decodeURIComponent(target.slice(1)));
}
/* How far below the screen's top a section lands — the spy's line too. */
function clearance(section, from) {
    return (px(getComputedStyle(document.documentElement).scrollPaddingTop) +
        px(getComputedStyle(section).scrollMarginTop) +
        px(getComputedStyle(from).getPropertyValue("--pg-anchor-edge")));
}
function destination(el, target) {
    if (target === "top")
        return 0;
    if (target === "bottom")
        return maxScroll();
    const section = sectionOf(target);
    if (!section)
        return null;
    const top = section.getBoundingClientRect().top + scrollY - clearance(section, el);
    return Math.min(Math.max(0, Math.round(top)), maxScroll());
}
/* A <time> variable, in ms. index.css registers them, so the browser hands
   them back resolved — in seconds; ms is read too. Reduced motion: 0. */
function timeOf(el, name, fallback) {
    if (reducedMotion())
        return 0;
    const raw = getComputedStyle(el).getPropertyValue(name).trim();
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(0, raw.endsWith("ms") ? n : n * 1000);
}
const WHEN = ["always", "passed", "never"];
function go(el, target, byKeyboard) {
    const top = destination(el, target);
    if (top === null)
        return;
    // A section writes its #id; top and bottom clear the hash — whether or
    // not the page then moves.
    if (option(el, HASH) === "true") {
        const hash = target.startsWith("#") ? target : "";
        if (location.hash !== hash)
            history.pushState(null, "", hash || location.pathname + location.search);
    }
    // "passed": back up to a section scrolled past, never down to one ahead.
    const when = keyword(el, "--pg-anchor-when", WHEN);
    if (when === "never" || (when === "passed" && top >= scrollY - 1))
        return;
    (scroller ?? glideTo)(top, timeOf(el, "--pg-anchor-duration", DEFAULT_DURATION), easingOf(el, "--pg-anchor-easing"));
    // From the keyboard, Tab carries on from the section, as a real jump
    // would; focus without a scroll of its own, the glide is doing that.
    // Not for "passed": that brings the reader back to the start of what
    // they are reading, it is no jump — focus stays on the tab pressed.
    const section = sectionOf(target);
    if (byKeyboard && section && when === "always") {
        if (!section.hasAttribute("tabindex"))
            section.setAttribute("tabindex", "-1");
        section.focus({ preventScroll: true });
    }
}
/* ---------- Reachable from the keyboard ---------- */
function isNative(el) {
    return isLink(el) || el instanceof HTMLButtonElement;
}
function reachable(el) {
    if (isNative(el))
        return;
    if (!el.hasAttribute("tabindex"))
        el.setAttribute("tabindex", "0");
    if (!el.hasAttribute("role"))
        el.setAttribute("role", "link");
}
/* ---------- Showing, stepping aside, spying ---------- */
function write(el, attr, value) {
    if (el.getAttribute(attr) === value)
        return;
    if (value === null)
        el.removeAttribute(attr);
    else
        el.setAttribute(attr, value);
}
function writeVar(el, name, value) {
    if (el.style.getPropertyValue(name) !== value)
        el.style.setProperty(name, value);
}
function show(el) {
    const raw = getComputedStyle(el).getPropertyValue("--pg-anchor-show-after");
    const after = raw.trim() ? px(raw) : DEFAULT_SHOW_AFTER;
    write(el, VISIBLE, String(scrollY >= after));
}
function stepAside(el, all) {
    // "none", for this screen size: no stepping aside, no passing under.
    const avoids = keyword(el, "--pg-anchor-avoid", ["auto", "none"]) === "auto";
    const areas = all.filter((area) => area.getAttribute(AVOID) !== "hide");
    const under = all.filter((area) => area.getAttribute(AVOID) === "hide");
    const rect = el.getBoundingClientRect();
    let lift = 0;
    let clipTop = 0;
    let clipBottom = 0;
    if (all.length && avoids) {
        // Where it sits without the lift it has now.
        const now = px(el.style.getPropertyValue(LIFT));
        const top = rect.top + now;
        const bottom = rect.bottom + now;
        const space = px(getComputedStyle(el).getPropertyValue("--pg-anchor-avoid-space"));
        const up = (top + bottom) / 2 > innerHeight / 2;
        // Areas can sit back to back: keep stepping until clear of all.
        for (let pass = 0; pass <= areas.length; pass++) {
            let moved = false;
            for (const area of areas) {
                const a = area.getBoundingClientRect();
                if (!a.width || !a.height || a.right <= rect.left || a.left >= rect.right)
                    continue;
                if (bottom - lift <= a.top - space || top - lift >= a.bottom + space)
                    continue;
                lift = up ? Math.max(lift, bottom - (a.top - space)) : Math.min(lift, top - (a.bottom + space));
                moved = true;
            }
            if (!moved)
                break;
        }
        // An area taller than the screen cannot be stepped around: stay on
        // screen, over it, rather than leave the screen.
        if (top - lift < 0 || bottom - lift > innerHeight)
            lift = 0;
        // "hide" areas: pass under them — the part they cover is cut off,
        // so the element goes in at one edge and comes out at the other.
        const at = { top: top - lift, bottom: bottom - lift };
        for (const area of under) {
            const a = area.getBoundingClientRect();
            if (!a.width || !a.height || a.right <= rect.left || a.left >= rect.right)
                continue;
            if (a.bottom <= at.top || a.top >= at.bottom)
                continue;
            if (a.top <= at.top)
                clipTop = Math.max(clipTop, Math.min(a.bottom, at.bottom) - at.top);
            if (a.bottom >= at.bottom)
                clipBottom = Math.max(clipBottom, at.bottom - Math.max(a.top, at.top));
        }
    }
    writeVar(el, LIFT, lift ? `${Math.round(lift)}px` : "0px");
    // Wide side insets keep the shadow on the sides that are not covered.
    const cutTop = Math.round(clipTop);
    const cutBottom = Math.round(clipBottom);
    const covered = cutTop + cutBottom >= Math.round(rect.height);
    writeVar(el, CLIP, cutTop || cutBottom ? `inset(${cutTop}px -100vmax ${cutBottom}px -100vmax)` : "none");
    write(el, COVERED, String(covered));
}
function spy(menu) {
    const links = [...menu.querySelectorAll(`[${ATTR}]`)];
    const atBottom = scrollY >= maxScroll() - 1;
    let current = null;
    let best = -Infinity;
    for (const link of links) {
        const section = sectionOf(targetOf(link));
        if (!section)
            continue;
        const top = section.getBoundingClientRect().top - clearance(section, link);
        // Reached the landing line (a pixel's slack for rounding) — or, at
        // the very bottom, simply on screen: the last sections can never
        // climb that far.
        const reached = top <= 1 || (atBottom && top < innerHeight);
        if (reached && top > best) {
            best = top;
            current = section;
        }
    }
    let marker = null;
    for (const link of links) {
        const on = current !== null && sectionOf(targetOf(link)) === current;
        write(link, CURRENT, String(on));
        write(link, "aria-current", on ? "location" : null);
        if (on && !marker)
            marker = link;
    }
    // Where the current link sits inside the menu, for a sliding marker.
    if (marker) {
        const m = menu.getBoundingClientRect();
        const r = marker.getBoundingClientRect();
        writeVar(menu, "--pg-anchor-current-left", `${Math.round(r.left - m.left - menu.clientLeft + menu.scrollLeft)}px`);
        writeVar(menu, "--pg-anchor-current-top", `${Math.round(r.top - m.top - menu.clientTop + menu.scrollTop)}px`);
        writeVar(menu, "--pg-anchor-current-width", `${Math.round(r.width)}px`);
        writeVar(menu, "--pg-anchor-current-height", `${Math.round(r.height)}px`);
    }
    else {
        writeVar(menu, "--pg-anchor-current-width", "0px");
        writeVar(menu, "--pg-anchor-current-height", "0px");
    }
}
/* ---------- Staying in place ---------- */
/* Still this many frames in a row: whatever moved it has settled. Long
   enough to outlast a short transition-delay before anything moves. */
const STILL_FRAMES = 20;
const STAY_LIMIT = 3000;
let stopStay = () => { };
/* Keep `el` where it is on screen: scroll by whatever it drifts. */
function stay(el) {
    stopStay();
    const at = el.getBoundingClientRect().top;
    const start = performance.now();
    let still = 0;
    let frame = 0;
    const user = ["wheel", "touchstart", "keydown"];
    const stop = () => {
        cancelAnimationFrame(frame);
        user.forEach((type) => removeEventListener(type, stop));
        stopStay = () => { };
    };
    const step = (now) => {
        if (!el.isConnected)
            return stop();
        const drift = el.getBoundingClientRect().top - at;
        if (Math.abs(drift) >= 0.5) {
            still = 0;
            const top = Math.min(Math.max(0, scrollY + drift), maxScroll());
            (scroller ?? glideTo)(top, 0, anchorEasing);
        }
        else {
            still++;
        }
        if (still >= STILL_FRAMES || now - start > STAY_LIMIT)
            stop();
        else
            frame = requestAnimationFrame(step);
    };
    user.forEach((type) => addEventListener(type, stop, { passive: true }));
    stopStay = stop;
    frame = requestAnimationFrame(step);
}
/* ---------- Strips ---------- */
/* CSS easing keywords and cubic-bezier(), as the browser reads them. */
const KEYWORDS = {
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
};
function bezier(x1, y1, x2, y2) {
    const at = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    return (x) => {
        if (x <= 0)
            return 0;
        if (x >= 1)
            return 1;
        // The curve's t for this x, by halving: monotonic in x for 0 ≤ x1, x2 ≤ 1.
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 24; i++) {
            const mid = (lo + hi) / 2;
            if (at(x1, x2, mid) < x)
                lo = mid;
            else
                hi = mid;
        }
        return at(y1, y2, (lo + hi) / 2);
    };
}
/* --pg-anchor-easing, --pg-anchor-strip-easing: linear, ease, ease-in,
   ease-out, ease-in-out or cubic-bezier(…). Anything else, or nothing:
   anchorEasing, Lenis's curve. */
function easingOf(el, name) {
    const raw = getComputedStyle(el).getPropertyValue(name).trim().toLowerCase();
    if (raw === "linear")
        return (t) => t;
    if (KEYWORDS[raw])
        return bezier(...KEYWORDS[raw]);
    const m = raw.match(/^cubic-bezier\(([^)]+)\)$/);
    const n = m ? m[1].split(",").map(Number) : [];
    if (n.length === 4 && n.every(Number.isFinite) && n[0] >= 0 && n[0] <= 1 && n[2] >= 0 && n[2] <= 1) {
        return bezier(n[0], n[1], n[2], n[3]);
    }
    return anchorEasing;
}
const strips = new WeakMap();
function stripOf(el) {
    let s = strips.get(el);
    if (!s) {
        s = { item: undefined, frame: 0, stop: () => { } };
        strips.set(el, s);
    }
    return s;
}
/* Where the row's scroll would put `item` as --pg-anchor-strip asks. */
function stripLeft(strip, item) {
    const align = keyword(strip, "--pg-anchor-strip", ["center", "start", "end", "none"]);
    if (align === "none")
        return null;
    const css = getComputedStyle(strip);
    const rtl = css.direction === "rtl";
    const box = strip.getBoundingClientRect();
    const r = item.getBoundingClientRect();
    const left = box.left + strip.clientLeft;
    const right = left + strip.clientWidth;
    const padLeft = px(css.scrollPaddingLeft);
    const padRight = px(css.scrollPaddingRight);
    const atLeft = (align === "start") !== rtl;
    let delta;
    if (align === "center")
        delta = r.left + r.width / 2 - (left + strip.clientWidth / 2);
    else if (atLeft)
        delta = r.left - (left + padLeft);
    else
        delta = r.right - (right - padRight);
    // The ends: it can go no further — so the first items stay at the
    // start and the last at the end, and only those between are centred.
    const max = Math.max(0, strip.scrollWidth - strip.clientWidth);
    const [min, top] = rtl ? [-max, 0] : [0, max];
    return Math.min(top, Math.max(min, Math.round(strip.scrollLeft + delta)));
}
function slide(strip, item, animate) {
    const state = stripOf(strip);
    state.stop();
    const to = stripLeft(strip, item);
    if (to === null)
        return;
    const from = strip.scrollLeft;
    const duration = animate ? timeOf(strip, "--pg-anchor-strip-duration", DEFAULT_STRIP_DURATION) : 0;
    if (duration <= 0 || Math.abs(to - from) < 1) {
        strip.scrollTo({ left: to, behavior: "instant" });
        return;
    }
    const ease = easingOf(strip, "--pg-anchor-strip-easing");
    const start = performance.now();
    // The user's own wheel, touch or press on the row stops it.
    const stoppers = ["wheel", "touchstart", "pointerdown"];
    const stop = () => {
        cancelAnimationFrame(state.frame);
        state.frame = 0;
        stoppers.forEach((type) => strip.removeEventListener(type, stop));
        state.stop = () => { };
    };
    const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        strip.scrollTo({ left: from + (to - from) * ease(t), behavior: "instant" });
        if (t < 1)
            state.frame = requestAnimationFrame(step);
        else
            stop();
    };
    stoppers.forEach((type) => strip.addEventListener(type, stop, { passive: true }));
    state.stop = stop;
    state.frame = requestAnimationFrame(step);
}
/* Keep the marked item in view; the first time, at once. */
function follow(strip) {
    const state = stripOf(strip);
    const item = strip.querySelector(MARKED);
    if (item === state.item)
        return;
    const first = state.item === undefined;
    state.item = item;
    if (item)
        slide(strip, item, !first);
}
/* Only the newest call answers events — a late cleanup from an older one
   (React remounting) cannot switch it off. Same rule as the other packages. */
let live = null;
/* Start listening; returns the cleanup for a React effect. */
export function initAnchor() {
    if (typeof document === "undefined")
        return () => { };
    const self = {};
    live = self;
    let floats = [];
    let areas = [];
    let menus = [];
    let rows = [];
    let dirty = true;
    let frame = 0;
    const update = () => {
        frame = 0;
        if (live !== self)
            return;
        if (dirty) {
            dirty = false;
            floats = [...document.querySelectorAll(`[${VISIBLE}]`)];
            areas = [...document.querySelectorAll(`[${AVOID}]`)];
            menus = [...document.querySelectorAll(`[${SPY}]`)];
            rows = [...document.querySelectorAll(`[${STRIP}]`)];
            document.querySelectorAll(`[${ATTR}]`).forEach(reachable);
        }
        floats.forEach((el) => {
            show(el);
            stepAside(el, areas);
        });
        menus.forEach(spy);
        // After the spy: a spy menu that is a strip follows its own mark.
        rows.forEach(follow);
    };
    const schedule = () => {
        if (!frame)
            frame = requestAnimationFrame(update);
    };
    const onClick = (event) => {
        if (live !== self || event.button !== 0 || !(event.target instanceof Element))
            return;
        // In a strip with nothing marked, the item clicked comes into view.
        // A marked one is followed by update(), once the click has marked it.
        const row = event.target.closest(`[${STRIP}]`);
        const item = row && event.target.closest(ITEM);
        if (row && item && item !== row && row.contains(item)) {
            requestAnimationFrame(() => {
                if (live === self && !row.querySelector(MARKED))
                    slide(row, item, true);
            });
        }
        const el = event.target.closest(`[${ATTR}]`);
        if (!el)
            return;
        // A link opened in a new tab or window stays the browser's.
        if (isLink(el) && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey))
            return;
        const target = targetOf(el);
        if (target !== "top" && target !== "bottom" && !sectionOf(target))
            return;
        event.preventDefault();
        // detail is 0 for a click that came from the keyboard.
        const byKeyboard = event.detail === 0;
        // A frame later: a menu closed by this same click unlocks the page
        // first, and the section is measured where it has settled.
        requestAnimationFrame(() => go(el, target, byKeyboard));
    };
    // Before any other click handler — targetFunctions closing the answer
    // above — so the place is noted while nothing has moved yet.
    const onClickFirst = (event) => {
        if (live !== self || !(event.target instanceof Element))
            return;
        const box = event.target.closest(`[${STAY}]`);
        const item = box && event.target.closest(ITEM);
        // An item that scrolls the page itself is left to do that.
        if (!box || !item || !box.contains(item) || item.hasAttribute(ATTR))
            return;
        if (keyword(item, "--pg-anchor-stay", ["auto", "none"]) === "none")
            return;
        stay(item);
    };
    const onKeydown = (event) => {
        if (live !== self || event.key !== "Enter" || !(event.target instanceof Element))
            return;
        const el = event.target.closest(`[${ATTR}]`);
        if (!el || isNative(el) || el !== event.target)
            return;
        event.preventDefault();
        el.click();
    };
    // The marks a strip follows change often — the spy's, a tab's — and
    // need no new look round the page; anything else does.
    const MARKS = ["aria-current", "aria-selected", "aria-expanded"];
    const mo = new MutationObserver((records) => {
        if (records.some((r) => !r.attributeName || !MARKS.includes(r.attributeName)))
            dirty = true;
        schedule();
    });
    document.addEventListener("click", onClickFirst, true);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    addEventListener("load", schedule);
    mo.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [ATTR, VISIBLE, AVOID, SPY, STRIP, ...MARKS],
    });
    // Now, not a frame later: a strip shows its current item from the start.
    update();
    return () => {
        document.removeEventListener("click", onClickFirst, true);
        document.removeEventListener("click", onClick);
        stopStay();
        document.removeEventListener("keydown", onKeydown);
        removeEventListener("scroll", schedule);
        removeEventListener("resize", schedule);
        removeEventListener("load", schedule);
        mo.disconnect();
        if (frame)
            cancelAnimationFrame(frame);
        if (live === self)
            live = null;
    };
}
