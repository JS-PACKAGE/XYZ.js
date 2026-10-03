export declare const audioDefaults: Readonly<{
    voiceCount: 8;
    lookahead: 0.1;
    tickMs: 25;
    releaseGuard: 0.02;
    gainSmoothing: 0.005;
    effectCrossfade: 0.02;
    effectsPerBus: 16;
    impulseValues: number;
    impulseSampleRate: 192000;
    duckAttack: 0.02;
    duckRelease: 0.2;
    /** Immediate native control starts in the future so independent calls cannot straddle a render quantum. */
    controlLead: 0.02;
}>;
