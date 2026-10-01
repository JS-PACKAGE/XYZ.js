export interface ResidencyBudgetOptions {
    textureBytes?: number;
    geometryBytes?: number;
}
export interface ResidencyStats {
    readonly budgetBytes: number;
    readonly liveBytes: number;
    readonly peakBytes: number;
    readonly entries: number;
    readonly evictions: number;
}
export interface GraphicsResidency {
    readonly textures: ResidencyStats;
    readonly geometry: ResidencyStats;
}
export declare function validateResidencyBudget(value: number | undefined): number;
/** Tracks native cache allocations, not attachments, pipelines or driver memory. */
export declare class ResidencyPool implements ResidencyStats {
    budgetBytes: number;
    liveBytes: number;
    peakBytes: number;
    evictions: number;
    private readonly allocations;
    private clock;
    private frame;
    private readonly framePins;
    private readonly lastFrame;
    private capture;
    get entries(): number;
    configure(bytes?: number): void;
    assertBudget(bytes?: number): void;
    beginFrame(): void;
    endFrame(): void;
    abortFrame(): void;
    retainFrameResources(): ResidencyAllocation[];
    beginCapture(): void;
    endCapture(): ResidencyAllocation[];
    allocate(bytes: number, retire: () => void): ResidencyAllocation;
    touch(allocation: ResidencyAllocation): void;
    resize(allocation: ResidencyAllocation, bytes: number): void;
    forget(allocation: ResidencyAllocation): void;
    clear(): void;
    private makeRoom;
}
export declare class ResidencyAllocation {
    private readonly pool;
    bytes: number;
    private readonly retire;
    references: number;
    lastUsed: number;
    destroyed: boolean;
    constructor(pool: ResidencyPool, bytes: number, retire: () => void);
    touch(): void;
    retain(): void;
    release(): void;
    resize(bytes: number): void;
    destroy(): void;
}
export declare class NativeResidency implements GraphicsResidency {
    readonly textures: ResidencyPool;
    readonly geometry: ResidencyPool;
    configure(options: ResidencyBudgetOptions): void;
    beginFrame(): void;
    endFrame(): void;
    abortFrame(): void;
    beginCapture(): void;
    endCapture(): ResidencyAllocation[];
    retainFrameResources(): ResidencyAllocation[];
    clear(): void;
}
