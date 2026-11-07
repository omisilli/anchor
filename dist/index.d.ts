export declare const anchorEasing: (t: number) => number;
export type AnchorScroller = (top: number, duration: number, easing: (t: number) => number) => void;
export declare function setAnchorScroller(next: AnchorScroller | null): void;
export declare function initAnchor(): () => void;
