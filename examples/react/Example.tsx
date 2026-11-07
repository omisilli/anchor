"use client";

import { useEffect } from "react";
import { initAnchor, setAnchorScroller } from "@plusguard/anchor";
import "@plusguard/anchor/index.css";
import { useLenis } from "lenis/react";

/* Mount once, high in the tree. Anchors rendered later are handled too. */
export function Anchors() {
    useEffect(() => initAnchor(), []);
    return null;
}

/* Only on pages with Lenis, inside <ReactLenis>: hands Lenis in, so a
   click glides with Lenis rather than beside it. */
export function LenisToAnchor() {
    const lenis = useLenis();

    useEffect(() => {
        if (!lenis) return;
        setAnchorScroller((top, ms, easing) =>
            lenis.scrollTo(top, ms ? { duration: ms / 1000, easing } : { immediate: true }),
        );
        return () => setAnchorScroller(null);
    }, [lenis]);

    return null;
}

const parts = [
    { id: "about", label: "About" },
    { id: "work", label: "Work" },
    { id: "contact", label: "Contact" },
];

/* The links and sections need no client code: this part can be a Server
   Component. In JSX a bare data-pg-anchor is fine — React writes "true",
   which counts as empty. */
export function Example() {
    return (
        <>
            <Anchors />

            {/* A sticky menu that marks the section you are in, with a line
                that slides under the current link. The sections below clear
                it with scroll-margin-top. A strip too: on a phone it scrolls
                sideways, and the current link stays in view. */}
            <nav
                data-pg-anchor-spy
                data-pg-anchor-strip
                className="sticky top-0 z-10 flex gap-1 overflow-x-auto bg-white/90 p-2 backdrop-blur [scrollbar-width:none]"
            >
                {parts.map((p) => (
                    <a
                        key={p.id}
                        href={`#${p.id}`}
                        data-pg-anchor
                        className="px-3 py-1.5 text-neutral-500 data-[pg-anchor-current=true]:text-black"
                    >
                        {p.label}
                    </a>
                ))}
                <span
                    aria-hidden
                    className="absolute bottom-1 left-[var(--pg-anchor-current-left)] h-0.5 w-[var(--pg-anchor-current-width)] bg-black transition-[left,width] duration-300"
                />
            </nav>

            {parts.map((p) => (
                <section key={p.id} id={p.id} className="min-h-screen scroll-mt-16 md:scroll-mt-20">
                    <h2>{p.label}</h2>
                </section>
            ))}

            <Tabs />

            {/* Mid-page: the ↑ button passes under it. */}
            <div data-pg-anchor-avoid="hide" className="h-64 bg-neutral-900" />

            {/* At the end: the ↑ button steps above it. */}
            <footer data-pg-anchor-avoid className="bg-black p-16 text-white">
                Footer
            </footer>

            {/* Back to top: shows after one screen (two on wide screens),
                keeps 16px from avoided areas — on a large screen it ignores
                them (--pg-anchor-avoid: none). JSX sets the starting
                data-pg-anchor-visible="false"; from then on anchor owns it. */}
            <button
                type="button"
                data-pg-anchor="top"
                data-pg-anchor-visible="false"
                aria-label="Back to top"
                className="fixed right-4 bottom-4 size-12 rounded-full bg-white shadow transition-[opacity,visibility] duration-300 [--pg-anchor-avoid-space:16px] [--pg-anchor-show-after:100svh] md:[--pg-anchor-show-after:200svh] lg:[--pg-anchor-avoid:none]"
            >
                ↑
            </button>
        </>
    );
}

/*
 * Tabs: targetFunctions opens one at a time (mount its initTargetFunctions
 * once, as anchor's), anchor scrolls. Each tab is a link to its panel; the
 * bar is sticky and a strip.
 *
 * - --pg-anchor-when: passed — from far down a long tab, a short one brings
 *   the reader back to its start; from its start, or above, nothing moves.
 *   Per screen size: md:[--pg-anchor-when:never] turns it off there.
 * - data-pg-anchor-strip — on a phone the tab pressed slides to the middle;
 *   the first ones stay at the start, the last at the end.
 *   [--pg-anchor-strip:start], [--pg-anchor-strip-duration:300ms],
 *   [--pg-anchor-strip-easing:ease-out] — or 0s, at once.
 * - data-pg-anchor-hash="true" writes #t-notices to the address; opening
 *   that address opens the tab — targetFunctions reads it.
 *
 * The panel lands right below the bar: the page's scroll-padding-top clears
 * the header, scroll-mt-12 the bar (h-12).
 *
 * Edge to edge: the bar steps out of the page's 1rem gutter (-mx-4) so a
 * scrolled tab reaches the screen's sides instead of stopping 1rem short;
 * px-4 puts the first tab back in line with the text, scroll-px-4 does the
 * same for --pg-anchor-strip: start.
 */
const tabs = [
    { id: "t-policies", name: "t1", title: "Policies" },
    { id: "t-procedures", name: "t2", title: "Procedures" },
    { id: "t-notices", name: "t3", title: "Notices" },
    { id: "t-cookies", name: "t4", title: "Cookie policy" },
    { id: "t-request", name: "t5", title: "Request form" },
    { id: "t-archive", name: "t6", title: "Archive" },
];

export function Tabs() {
    return (
        <section className="[--pg-anchor-when:passed]" data-pg-anchor-hash="true">
            <nav
                data-pg-anchor-strip
                className="sticky top-14 z-[5] -mx-4 flex h-12 scroll-px-4 overflow-x-auto border-b bg-white px-4 [scrollbar-width:none]"
            >
                {tabs.map(({ id, name, title }) => (
                    <a
                        key={id}
                        href={`#${id}`}
                        data-pg-anchor
                        data-pg-target-functions={`close-tab-except-${name} open-${name}`}
                        aria-controls={id}
                        className="grid flex-none place-items-center border-b-2 border-transparent px-4 whitespace-nowrap text-neutral-500 aria-expanded:border-black aria-expanded:text-black"
                    >
                        {title}
                    </a>
                ))}
            </nav>
            {tabs.map(({ id, name, title }, i) => (
                <div
                    key={id}
                    id={id}
                    data-pg-target={`${name} tab`}
                    data-pg-target-active={i === 0 ? "true" : "false"}
                    className="scroll-mt-12 py-5 data-[pg-target-active=false]:hidden"
                >
                    <h3>{title}</h3>
                </div>
            ))}
        </section>
    );
}
