import type { Game, SetSceneOptions } from './game.js';
import type { Scene } from './scene.js';
import type { ResourceScope } from '../../assets/src/resource-scope.js';
export interface HotSceneContext {
    readonly game: Game;
    readonly resources: ResourceScope;
    readonly signal: AbortSignal;
}
export type HotSceneFactory = (context: HotSceneContext) => Scene | Promise<Scene>;
export interface HotSceneOptions {
    /** Default true. The owner never creates a second Game/canvas. */
    destroyGameOnDispose?: boolean;
    publication?: Omit<SetSceneOptions, 'signal'>;
}
/** Prepare on the existing Game; Game.setScene is the sole publication boundary.
 * Factories must acquire candidate resources through context.resources and honor signal.
 */
export declare class HotSceneOwner {
    readonly game: Game;
    private readonly options;
    private disposed;
    private disposal?;
    private pending?;
    private current?;
    private readonly jobs;
    constructor(game: Game, options?: HotSceneOptions);
    replace(factory: HotSceneFactory): Promise<Scene>;
    dispose(): Promise<void>;
}
/** Structural Vite protocol: no Vite import or runtime dependency. */
export interface SceneHotAdapter<Module> {
    accept(dependency: string, callback: (module: Module | undefined) => void): void;
    dispose(callback: () => void): void;
}
export declare function bindSceneHotReload<Module>(owner: HotSceneOwner, hot: SceneHotAdapter<Module>, dependency: string, factory: (module: Module) => HotSceneFactory, onError: (error: unknown) => void): void;
