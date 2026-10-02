import type { ResourcePool, ResourceScope } from '../../assets/src/resource-scope.js';
import { FactoryRegistry, type FactoryDefinitions, type FactoryNode, type FactoryOptions, type FactoryServices } from './factories.js';
import type { Scene } from './scene.js';
import type { SceneObject } from './scene-object.js';
import { WorldStreamingNavigation3D, type WorldStreamingNavigationFragment3D } from './world-streaming-navigation.js';
export interface WorldStreamingPoint {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}
export interface WorldStreamingBounds {
    readonly min: WorldStreamingPoint;
    readonly max: WorldStreamingPoint;
}
export interface WorldStreamingCandidate {
    /** One fresh detached prefab; its descendants are owned, resources are borrowed through the scope. */
    readonly root: SceneObject;
    readonly navigation?: WorldStreamingNavigationFragment3D;
}
export interface WorldStreamingLoadContext {
    readonly cell: WorldStreamingCell;
    readonly signal: AbortSignal;
    readonly resources: ResourceScope;
    /** Claim the root before awaiting fallible work. Late returned roots are also reclaimed. */
    own<Node extends SceneObject>(root: Node): Node;
    createFactory<Definitions extends FactoryDefinitions, Kind extends Extract<keyof Definitions, string>>(registry: FactoryRegistry<Definitions>, kind: Kind, options: FactoryOptions<Definitions[Kind]>, services: FactoryServices<Definitions>): Promise<FactoryNode<Definitions[Kind]>>;
}
export interface WorldStreamingCell {
    readonly id: string;
    readonly bounds: WorldStreamingBounds;
    /** Higher priority wins, then distance, then catalog order. */
    readonly priority?: number;
    readonly load: (context: WorldStreamingLoadContext) => WorldStreamingCandidate | Promise<WorldStreamingCandidate>;
}
export interface WorldStreamingOptions {
    readonly cells: readonly WorldStreamingCell[];
    /** World-space selection point; no camera or physics service is initialized implicitly. */
    readonly focus: () => WorldStreamingPoint;
    readonly activeDistance?: number;
    readonly prefetchDistance?: number;
    /** Hysteresis for already-active cells; nearest/priority admission still respects maxActive. */
    readonly retireDistance?: number;
    readonly maxActive?: number;
    /** Includes cancelled non-cooperative loads until they actually settle. */
    readonly maxPending?: number;
    /** Admission reservations include active, prefetched and pending candidates, not GPU-byte estimates. */
    readonly maxResident?: number;
    readonly admissionsPerFrame?: number;
    readonly onError?: (failure: WorldStreamingFailure) => void;
}
export type WorldStreamingCellState = 'unloaded' | 'loading' | 'cancelling' | 'ready' | 'active' | 'failed';
export interface WorldStreamingFailure {
    readonly cell: string;
    readonly phase: 'load' | 'publish' | 'retire' | 'cleanup';
    readonly error: unknown;
}
export interface WorldStreamingCellStatus {
    readonly id: string;
    readonly state: WorldStreamingCellState;
    readonly error: unknown;
    readonly activeWanted: boolean;
    readonly residentWanted: boolean;
}
export interface WorldStreamingStats {
    readonly active: number;
    readonly ready: number;
    readonly pending: number;
    readonly cancelling: number;
    readonly resident: number;
    readonly failed: number;
    readonly admissions: number;
    readonly publications: number;
    readonly retirements: number;
    readonly cancellations: number;
}
/** Scene-owned cell lifecycle. Async work only prepares; publication occurs at visible frame boundaries. */
export declare class WorldStreamingController extends EventTarget {
    readonly scene: Scene;
    readonly resources: ResourcePool;
    private readonly options;
    readonly navigation: WorldStreamingNavigation3D;
    readonly maxActive: number;
    readonly maxPending: number;
    readonly maxResident: number;
    readonly admissionsPerFrame: number;
    readonly activeDistance: number;
    readonly prefetchDistance: number;
    readonly retireDistance: number;
    private readonly records;
    private readonly ranked;
    private readonly fragments;
    private running;
    private paused;
    private disposed;
    private processing;
    private admissions;
    private publications;
    private retirements;
    private cancellations;
    constructor(scene: Scene, resources: ResourcePool, options: WorldStreamingOptions);
    get destroyed(): boolean;
    get enabled(): boolean;
    set enabled(value: boolean);
    get isPaused(): boolean;
    setPaused(value: boolean): void;
    getCell(id: string): WorldStreamingCellStatus;
    get stats(): WorldStreamingStats;
    /** Failures are sticky. Explicit retry never silently replaces a live/erroring cell with a fallback. */
    retry(id: string): void;
    /** Run once per visible Game frame after focus input and before navigation. Never publishes during pause. */
    update(focus?: WorldStreamingPoint): void;
    /** Wait for admitted work, including non-cooperative cancelled loaders. Does not admit/publish work. */
    settled(): Promise<void>;
    destroy(): void;
    private admit;
    private publish;
    private retire;
    private cancel;
    private release;
    private fail;
    private clear;
}
