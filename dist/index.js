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
 *   data-pg-anchor-duration   the glide, in ms. Default 1200
 *   data-pg-anchor-hash       "true" writes #id to the address bar; "false",
 *                             the default, leaves the address as it is
 *
 * Where a section lands: below the page's scroll-padding-top, its own
 * scroll-margin-top and --pg-anchor-edge (index.css) — a fixed header is
 * cleared with those, per screen size through media queries.
 *
 * The glide runs frame by frame on Lenis's curve, in both modes; the
 * user's wheel, touch or keys stop it, and with reduced motion asked for it
 * is a jump. On a page with Lenis, hand Lenis in with setAnchorScroller.
 *
 * Showing: an element with data-pg-anchor-visible (write "false" to start)
 * turns "true" once the page has scrolled --pg-anchor-show-after. It also
 * steps out of the way of data-pg-anchor-avoid areas — up when it sits in
 * the lower half of the screen, down in the upper — keeping
 * --pg-anchor-avoid-space, wherever data-pg-anchor-avoid-media matches.
 *
 * Spy: in a data-pg-anchor-spy menu, the links whose section has reached
 * the landing line get data-pg-anchor-current="true" and
 * aria-current="location"; the menu gets --pg-anchor-current-left / -top /
 * -width / -height, for a marker that slides under the current link.
 *
 * A <p> or <div> with data-pg-anchor is made reachable: tabindex="0",
 * role="link", and Enter.
 */
const ATTR = "data-pg-anchor";
const DURATION = "data-pg-anchor-duration";
const HASH = "data-pg-anchor-hash";
const VISIBLE = "data-pg-anchor-visible";
const AVOID = "data-pg-anchor-avoid";
const AVOID_MEDIA = "data-pg-anchor-avoid-media";
const SPY = "data-pg-anchor-spy";
const CURRENT = "data-pg-anchor-current";
const LIFT = "--pg-anchor-lift";
const DEFAULT_DURATION = 1200;
const DEFAULT_SHOW_AFTER = 400;
/* Lenis's own curve: off fast, then a long soft landing. */
export const anchorEasing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
let scroller = null;
/*
 * With Lenis, hand it in; null goes back to the built-in glide.
 *
 *   setAnchorScroller((top, ms) =>
 *       lenis.scrollTo(top, ms ? { duration: ms / 1000, easing: anchorEasing } : { immediate: true }));
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
function glideTo(top, duration) {
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
        scrollTo({ top: from + (top - from) * anchorEasing(t), behavior: "instant" });
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
function durationOf(el) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
        return 0;
    const raw = option(el, DURATION);
    // Not set, empty or not a number: the default. "0": a jump.
    const ms = raw ? Number(raw) : Number.NaN;
    return Number.isFinite(ms) ? Math.max(0, ms) : DEFAULT_DURATION;
}
function go(el, target, byKeyboard) {
    const top = destination(el, target);
    if (top === null)
        return;
    // A section writes its #id; top and bottom clear the hash.
    if (option(el, HASH) === "true") {
        const hash = target.startsWith("#") ? target : "";
        if (location.hash !== hash)
            history.pushState(null, "", hash || location.pathname + location.search);
    }
    (scroller ?? glideTo)(top, durationOf(el));
    // From the keyboard, Tab carries on from the section, as a real jump
    // would; focus without a scroll of its own, the glide is doing that.
    const section = sectionOf(target);
    if (byKeyboard && section) {
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
function stepAside(el, areas) {
    const media = el.getAttribute(AVOID_MEDIA);
    let lift = 0;
    if (areas.length && (!media || matchMedia(media).matches)) {
        const rect = el.getBoundingClientRect();
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
    }
    writeVar(el, LIFT, lift ? `${Math.round(lift)}px` : "0px");
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
            document.querySelectorAll(`[${ATTR}]`).forEach(reachable);
        }
        floats.forEach((el) => {
            show(el);
            stepAside(el, areas);
        });
        menus.forEach(spy);
    };
    const schedule = () => {
        if (!frame)
            frame = requestAnimationFrame(update);
    };
    const onClick = (event) => {
        if (live !== self || event.button !== 0 || !(event.target instanceof Element))
            return;
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
    const onKeydown = (event) => {
        if (live !== self || event.key !== "Enter" || !(event.target instanceof Element))
            return;
        const el = event.target.closest(`[${ATTR}]`);
        if (!el || isNative(el) || el !== event.target)
            return;
        event.preventDefault();
        el.click();
    };
    const mo = new MutationObserver(() => {
        dirty = true;
        schedule();
    });
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    addEventListener("load", schedule);
    mo.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [ATTR, VISIBLE, AVOID, SPY],
    });
    schedule();
    return () => {
        document.removeEventListener("click", onClick);
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
