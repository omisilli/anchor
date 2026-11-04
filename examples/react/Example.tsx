"use client";

import { useEffect } from "react";
import { initAnchor, setAnchorScroller, anchorEasing } from "@plusguard/anchor";
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
        setAnchorScroller((top, ms) =>
            lenis.scrollTo(top, ms ? { duration: ms / 1000, easing: anchorEasing } : { immediate: true }),
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
                it with scroll-margin-top. */}
            <nav data-pg-anchor-spy className="sticky top-0 z-10 flex gap-1 bg-white/90 p-2 backdrop-blur">
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

            {/* Avoided: the ↑ button steps above it. */}
            <footer data-pg-anchor-avoid className="bg-black p-16 text-white">
                Footer
            </footer>

            {/* Back to top: shows after one screen (two on wide screens),
                keeps 16px from avoided areas. JSX sets the starting
                data-pg-anchor-visible="false"; from then on anchor owns it. */}
            <button
                type="button"
                data-pg-anchor="top"
                data-pg-anchor-visible="false"
                aria-label="Back to top"
                className="fixed right-4 bottom-4 size-12 rounded-full bg-white shadow transition-[opacity,visibility] duration-300 [--pg-anchor-avoid-space:16px] [--pg-anchor-show-after:100svh] md:[--pg-anchor-show-after:200svh]"
            >
                ↑
            </button>
        </>
    );
}
