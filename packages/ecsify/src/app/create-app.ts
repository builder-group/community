import { withNew } from '@blgc/utils';
import {
	createComponentRegistry,
	TComponentRef,
	TComponentValue,
	TUpdateComponentValue
} from '../component';
import { createEntityIndex, TEntityId } from '../entity';
import { createEventRegistry, TEvent } from '../event';
import { createQueryRegistry, TQueryRegistry } from '../query';
import { createSystemRegistry, TAddSystemOptions, TSystemFn } from '../system';
import { TAnyPlugin, TApp, TAppContext, TPluginsFromAppContext } from './types';

/**
 * Creates a new ECS application instance.
 *
 * @param config - Configuration options
 * @returns A new ECS application instance
 */
export function createApp<
	GPlugins extends TAnyPlugin[],
	GAppContext extends TAppContext<GPlugins> = TAppContext<GPlugins>
>(config: TCreateAppConfig<GPlugins, GAppContext>): TApp<GAppContext> {
	const { plugins, systemSets, debug } = config;

	return withNew<TApp<GAppContext>, [GPlugins]>(
		{
			_pluginNames: [],
			_componentRegistry: createComponentRegistry(),
			_entityIndex: createEntityIndex(),
			_queryRegistry: null as unknown as TQueryRegistry, // Will be set in _new
			_systemRegistry: createSystemRegistry<GAppContext['systemSets'], TApp<GAppContext>>(
				systemSets as GAppContext['systemSets'][]
			),
			_eventRegistry: createEventRegistry<GAppContext['events']>(),

			c: {} as GAppContext['components'], // Will be set in _new
			r: {} as GAppContext['resources'], // Will be set in _new

			_new(plugins) {
				this._queryRegistry = createQueryRegistry(this._entityIndex, this._componentRegistry);

				this.addPlugins(plugins);
			},

			...({} as GAppContext['appExtensions']), // Will be set in _new

			addPlugin<GNewPlugin extends TAnyPlugin>(
				plugin: GNewPlugin
			): TApp<TAppContext<[GNewPlugin, ...TPluginsFromAppContext<GAppContext>]>> {
				// Validate dependencies exist
				for (const depName of plugin.deps as string[]) {
					if (!this._pluginNames.includes(depName)) {
						throw new Error(`Plugin '${plugin.name}' depends on '${depName}' which is not loaded`);
					}
				}

				// Add plugin name to registry
				this._pluginNames.push(plugin.name);

				// Add components to c
				if (plugin.components) {
					Object.assign(this.c, plugin.components);
				}

				// Add resources to r
				if (plugin.resources) {
					Object.assign(this.r, plugin.resources);
				}

				// Add appExtensions directly to this
				if (plugin.appExtensions) {
					Object.assign(this, plugin.appExtensions);
				}

				// Call setup if it exists
				if (plugin.setup != null) {
					plugin.setup(this as unknown as TApp);
				}

				return this as unknown as TApp<
					TAppContext<[GNewPlugin, ...TPluginsFromAppContext<GAppContext>]>
				>;
			},

			addPlugins<GNewPlugins extends TAnyPlugin[]>(
				plugins: GNewPlugins
			): TApp<TAppContext<[...GNewPlugins, ...TPluginsFromAppContext<GAppContext>]>> {
				for (const plugin of plugins) {
					this.addPlugin(plugin);
				}

				return this as unknown as TApp<
					TAppContext<[...GNewPlugins, ...TPluginsFromAppContext<GAppContext>]>
				>;
			},

			createEntity() {
				return this._entityIndex.createEntity();
			},

			destroyEntity(eid) {
				this._componentRegistry.removeAllComponents(eid);
				this._entityIndex.removeEntity(eid);
			},

			addComponent<GComponent extends TComponentRef>(
				eid: TEntityId,
				component: GComponent,
				value?: TComponentValue<GComponent>
			): void {
				this._componentRegistry.addComponent(eid, component, value);
			},

			updateComponent<GComponent extends TComponentRef>(
				eid: TEntityId,
				component: GComponent,
				value: TUpdateComponentValue<GComponent>,
				markAsChanged?: boolean
			): void {
				this._componentRegistry.updateComponent(eid, component, value, markAsChanged);
			},

			removeComponent(eid, component) {
				return this._componentRegistry.removeComponent(eid, component);
			},

			hasComponent(eid, component) {
				return this._componentRegistry.hasComponent(eid, component);
			},

			markComponentChanged(eid, component) {
				return this._componentRegistry.markChanged(eid, component);
			},

			queryEntities(queryOrFilter, options) {
				return this._queryRegistry.queryEntities(queryOrFilter, options);
			},

			queryComponents(components, queryOrFilter) {
				return this._queryRegistry.queryComponents(components, queryOrFilter);
			},

			addSystem(
				fn: TSystemFn<GAppContext['systemSets'], TApp<GAppContext>>,
				options?: TAddSystemOptions<GAppContext['systemSets'], TApp<GAppContext>>
			): void {
				this._systemRegistry.addSystem(fn, options);
			},

			pushEvent<GType extends keyof GAppContext['events']>(
				type: GType,
				data: GAppContext['events'][GType]
			): void {
				this._eventRegistry.push(type, data);
			},

			readEvent<GType extends keyof GAppContext['events']>(
				type: GType
			): TEvent<GAppContext['events'][GType]>[] {
				return this._eventRegistry.read(type);
			},

			consumeEvent<GType extends keyof GAppContext['events']>(
				type: GType
			): TEvent<GAppContext['events'][GType]>[] {
				return this._eventRegistry.consume(type);
			},

			update(delta) {
				this._systemRegistry.update(this as any, delta);
			},

			flush() {
				this._componentRegistry.flush();
				this._eventRegistry.flush();
			},

			reset() {
				this._componentRegistry.reset();
				this._entityIndex.reset();
				this._queryRegistry.reset();
			}
		},
		plugins
	);
}

interface TCreateAppConfig<
	GPlugins extends TAnyPlugin[],
	GAppContext extends TAppContext<GPlugins> = TAppContext<GPlugins>
> {
	plugins: GPlugins;
	systemSets: GAppContext['systemSets'][];
	debug?: boolean;
}
