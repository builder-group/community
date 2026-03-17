import { TComponentRef } from '../component';
import { TApp } from './types/app';
import { TAnyPlugin, TPlugin } from './types/plugin';

/**
 * Defines a plugin with full type inference.
 *
 * Raw inline objects lack the `__brand` marker that `TPlugin` carries, which prevents
 * TypeScript from inferring the plugin's shape when it's passed to `createApp` or `addPlugin`.
 * Wrapping with `definePlugin` stamps the correct `TPlugin<GShape, GDeps>` type so that
 * resources, components, and other contributions are properly reflected on the app type.
 *
 * @example
 * ```typescript
 * const inputPlugin = definePlugin({
 *   name: 'Input',
 *   deps: [],
 *   resources: { inputState: { jump: false } }
 * });
 * ```
 */
export function definePlugin<
	GName extends string,
	GDeps extends TAnyPlugin[] = [],
	GComponents extends Record<string, TComponentRef> = {},
	GResources extends Record<string, unknown> = {},
	GEvents extends Record<string, unknown> = {},
	GSystemSets extends string = never,
	GAppExtensions extends Record<string, unknown> = {}
>(plugin: {
	name: GName;
	deps: { [K in keyof GDeps]: GDeps[K]['name'] };
	components?: GComponents;
	resources?: GResources;
	events?: GEvents;
	appExtensions?: GAppExtensions;
	setup?: (app: TApp<any>) => void;
}): TPlugin<
	{
		name: GName;
		components: GComponents;
		resources: GResources;
		events: GEvents;
		systemSets: GSystemSets;
		appExtensions: GAppExtensions;
	},
	GDeps
> &
	(keyof GComponents extends never ? object : { components: GComponents }) &
	(keyof GResources extends never ? object : { resources: GResources }) &
	(keyof GEvents extends never ? object : { events: GEvents }) &
	(keyof GAppExtensions extends never ? object : { appExtensions: GAppExtensions }) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return plugin as any;
}
