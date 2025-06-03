import { TComponentRef } from '../../component';
import { TExtractField } from '../../types';
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
	deps: GDeps;
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

export type TShapeFromPlugin<GPlugin extends TAnyPlugin> =
	GPlugin extends TPlugin<infer GShape, any> ? GShape : never;

export type TMergeTwoPluginShapes<A, B> = {
	components: TExtractField<A, 'components', {}> & TExtractField<B, 'components', {}>;
	resources: TExtractField<A, 'resources', {}> & TExtractField<B, 'resources', {}>;
	events: TExtractField<A, 'events', {}> & TExtractField<B, 'events', {}>;
	appExtensions: TExtractField<A, 'appExtensions', {}> & TExtractField<B, 'appExtensions', {}>;
	systemSets: TExtractField<A, 'systemSets', never> | TExtractField<B, 'systemSets', never>;
};

/**
 * Recursively merges plugin *shapes* (not full plugin types).
 *
 * This avoids TypeScript recursion limits and circular type constraints
 * caused by merging plugin objects directly (e.g., with `setup` functions).
 */
export type TMergePlugins<GPlugins extends TAnyPlugin[]> = GPlugins extends [
	infer GFirst,
	...infer GRest
]
	? GFirst extends TAnyPlugin
		? TMergeTwoPluginShapes<TShapeFromPlugin<GFirst>, TMergePlugins<Extract<GRest, TAnyPlugin[]>>>
		: TMergePlugins<Extract<GRest, TAnyPlugin[]>>
	: {};
