/** Historical small Canvas2D Game + Scene + Sprite consumer before backend isolation. */
export declare const startupBaseline: {
    readonly minifiedBytes: 841577;
    readonly gzipBytes: 214169;
};
/** Absolute regression ceilings, not a promised percentage or runtime performance target. */
export declare const startupBudgets: {
    readonly mathMinifiedBytes: 4096;
    readonly canvasInitialMinifiedBytes: number;
    readonly canvasInitialGzipBytes: number;
    readonly canvasStartupMinifiedBytes: number;
    readonly canvasStartupGzipBytes: number;
    readonly lazyMinifiedBytes: 841577;
    /**
     * Deferred chunks load only after startup. Their gzip size outgrew the historical
     * baseline (221664 bytes, mostly shader template literals), so this ceiling was raised
     * by owner decision to 220 KiB; the startup ceilings above still track the baseline.
     */
    readonly lazyGzipBytes: 225280;
};
