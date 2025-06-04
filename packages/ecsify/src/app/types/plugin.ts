import { TComponentRef } from '../../component';
import { TApp, TInnerAppContext } from './app';

export type TPluginComponents = Record<string, TComponentRef>;
export type TPluginResources = Record<string, unknown>;
export type TPluginEvents = Record<string, unknown>;

// =============================================================================
// Plugin
// =============================================================================

export type TPlugin<
	GShape extends TPluginShape,
	GDeps extends TAnyPlugin[] = [],
	GAppContext extends TInnerAppContext = TInnerAppContext<
		TMergeTwoPluginShapes<GShape, TMergePlugins<GDeps>>
	>
> = {
	name: GShape['name'];
	deps: {
		[K in keyof GDeps]: GDeps[K]['name'];
	};
	components?: GShape['components'];
	resources?: GShape['resources'];
	appExtensions?: GShape['appExtensions'];
	setup?: (app: TApp<GAppContext>) => void;
};

export interface TPluginShape {
	/**
	 * Plugin name (for identification).
	 */
	name: string;

	/**
	 * ECS components added by the plugin.
	 */
	components?: TPluginComponents;

	/**
	 * Global resources shared in the app.
	 */
	resources?: TPluginResources;

	/**
	 * Event types emitted or handled by the plugin.
	 */
	events?: TPluginEvents;

	/**
	 * ECS system execution order sets.
	 */
	systemSets?: string;

	/**
	 * Methods that extend the app instance.
	 */
	appExtensions?: Record<string, unknown>;
}

/**
 * A "top type" that can represent any plugin regardless of its specific shape, dependencies, or app context.
 *
 * All generic parameters MUST be `any` to avoid TypeScript compatibility issues:
 *
 * **Why `any` is required:**
 * - Specific plugins have precise setup function signatures: `(app: TApp<SpecificContext>) => void`
 * - If TAnyPlugin used specific types, TypeScript would reject assignments like:
 *   `TPlugin<ShapeA, DepsB, ContextC>` → `TAnyPlugin`
 * - The error occurs because setup functions are contravariant in their parameter types
 *
 * **Example of the error without `any`:**
 * ```
 * Type 'TPlugin<SpecificShape, SpecificDeps, SpecificContext>' is not assignable to type 'TAnyPlugin'
 *   Types of property 'setup' are incompatible
 *     Type '(app: TApp<SpecificContext>) => void' is not assignable to type '(app: TApp<OtherContext>) => void'
 * ```
 */
export type TAnyPlugin = TPlugin<any, any, any>;

/**
 * Extracts the `GShape` type from any variation of a TPlugin.
 *
 * Note: TypeScript's `infer` in conditional types only works when the matched type
 *     has the *same number of generic parameters* as the one you're checking against.
 *     That means:
 *       - `TPlugin<A>` ≠ `TPlugin<A, any, any>`
 *       - `TPlugin<A, B>` ≠ `TPlugin<A, B, any>`
 *     If you don't account for all generic arities, inference will silently fail.
 */
export type TShapeFromPlugin<GPlugin> =
	GPlugin extends TPlugin<infer GShape, any, any>
		? GShape
		: GPlugin extends TPlugin<infer GShape, any>
			? GShape
			: GPlugin extends TPlugin<infer GShape>
				? GShape
				: never;

export type TMergeTwoPluginShapes<A, B> = {
	components: (A extends { components: infer AC } ? AC : {}) &
		(B extends { components: infer BC } ? BC : {});
	resources: (A extends { resources: infer AR } ? AR : {}) &
		(B extends { resources: infer BR } ? BR : {});
	events: (A extends { events: infer AE } ? AE : {}) & (B extends { events: infer BE } ? BE : {});
	appExtensions: (A extends { appExtensions: infer AA } ? AA : {}) &
		(B extends { appExtensions: infer BA } ? BA : {});
	systemSets:
		| (A extends { systemSets: infer AS } ? AS : never)
		| (B extends { systemSets: infer BS } ? BS : never);
};

/**
 * Recursively merges plugin *shapes* (not full plugin types).
 *
 * This avoids TypeScript recursion limits and circular type constraints
 * caused by merging plugin objects directly (e.g., with `setup` functions).
 */
export type TMergePlugins<GPlugins extends TAnyPlugin[]> = GPlugins extends readonly [
	infer GFirst,
	...infer GRest
]
	? GFirst extends TAnyPlugin
		? GRest extends TAnyPlugin[]
			? TMergeTwoPluginShapes<TShapeFromPlugin<GFirst>, TMergePlugins<GRest>>
			: TShapeFromPlugin<GFirst>
		: {}
	: {};
