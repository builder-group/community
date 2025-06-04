import { TComponentRef } from '../../component';
import { TApp } from './app';

// =============================================================================
// Plugin
// =============================================================================

export type TPlugin<GShape extends TPluginShape, GDeps extends TAnyPlugin[] = []> = {
	/**
	 * Internal marker to preserve generic type information during TypeScript's type flattening.
	 * Without this, TypeScript cannot infer GShape from TPlugin instances.
	 */
	__brand?: [GShape, GDeps];
	name: GShape['name'];
	deps: {
		[K in keyof GDeps]: GDeps[K]['name'];
	};
	components?: GShape['components'];
	resources?: GShape['resources'];
	appExtensions?: GShape['appExtensions'];
	/**
	 * Setup function called when the plugin is added to the app.
	 *
	 * Uses `TApp<any>` instead of the exact app context type to break circular type dependency.
	 * See: https://github.com/builder-group/community/issues/107
	 */
	setup?: (app: TApp<any>) => void;
};

export interface TPluginShape {
	/**
	 * Plugin name (for identification).
	 */
	name: string;

	/**
	 * ECS components added by the plugin.
	 */
	components?: Record<string, TComponentRef>;

	/**
	 * Global resources shared in the app.
	 */
	resources?: Record<string, unknown>;

	/**
	 * Event types emitted or handled by the plugin.
	 */
	events?: Record<string, unknown>;

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
 * Type that represents any plugin regardless of its specific shape or dependencies.
 */
export type TAnyPlugin = TPlugin<any, any>;

/**
 * Extracts the shape type from a TPlugin.
 *
 * Note: TypeScript's `infer` in conditional types only works when the matched type
 *     has the *same number of generic parameters* as the one you're checking against.
 *     That means:
 *       - `TPlugin<A>` ≠ `TPlugin<A, any>`
 *     If you don't account for all generic arities, inference will resolve to `never`.
 */
export type TShapeFromPlugin<GPlugin> =
	GPlugin extends TPlugin<infer GShape, any>
		? GShape
		: GPlugin extends TPlugin<infer GShape>
			? GShape
			: never;

/**
 * Merges two plugin shapes by combining their properties.
 */
export type TMergeTwoPluginShapes<A, B> = {
	components: (A extends { components: infer GComponents } ? GComponents : {}) &
		(B extends { components: infer GComponents } ? GComponents : {});
	resources: (A extends { resources: infer GResources } ? GResources : {}) &
		(B extends { resources: infer GResources } ? GResources : {});
	events: (A extends { events: infer GEvents } ? GEvents : {}) &
		(B extends { events: infer GEvents } ? GEvents : {});
	appExtensions: (A extends { appExtensions: infer GAppExtensions } ? GAppExtensions : {}) &
		(B extends { appExtensions: infer GAppExtensions } ? GAppExtensions : {});
	systemSets:
		| (A extends { systemSets: infer GSystemSets } ? GSystemSets : never)
		| (B extends { systemSets: infer GSystemSets } ? GSystemSets : never);
};

/**
 * Recursively merges plugin shapes from an array of plugins.
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
