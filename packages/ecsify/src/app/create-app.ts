import { withNew } from '@blgc/utils';
import {
	createComponentRegistry,
	TComponentRef,
	TComponentValue,
	TUpdateComponentValue
} from '../component';
import { createEntityIndex, TEntityId } from '../entity';
import { createEventRegistry, TEvent } from '../event';
import { createQueryRegistry } from '../query';
import { createSystemRegistry, TAddSystemOptions, TSystemFn } from '../system';
import { createDefaultPlugin } from './plugins';
import { TAnyPlugin, TApp, TAppContext } from './types';

export function createApp<
	GPlugins extends TAnyPlugin[],
	GAppContext extends TAppContext<GPlugins> = TAppContext<GPlugins>
>(options: TCreateAppOptions<GPlugins, GAppContext> = {}): TApp<GAppContext> {
	const {
		plugins = [createDefaultPlugin()],
		systemSets = ['First', 'Update', 'Last'],
		debug
	} = options;

	return withNew<TApp<GAppContext>>({
		_pluginNames: plugins.map((p) => p.name),
		_componentRegistry: createComponentRegistry(),
		_entityIndex: createEntityIndex(),
		_queryRegistry: null as any, // Will be set in _new
		_systemRegistry: createSystemRegistry<GAppContext['systemSets'], TApp<GAppContext>>(
			systemSets as GAppContext['systemSets'][]
		),
		_eventRegistry: createEventRegistry<GAppContext['events']>(),

		c: plugins.reduce(
			(acc, plugin) => ({
				...acc,
				...(plugin.components ?? {})
			}),
			{}
		) as GAppContext['components'],
		r: plugins.reduce(
			(acc, plugin) => ({
				...acc,
				...(plugin.resources ?? {})
			}),
			{}
		) as GAppContext['resources'],

		_new() {
			this._queryRegistry = createQueryRegistry(this._entityIndex, this._componentRegistry);
		},

		...(plugins.reduce(
			(acc, plugin) => ({
				...acc,
				...(plugin.appExtensions ?? {})
			}),
			{}
		) as GAppContext['appExtensions']),

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

		queryEntities(filter, options) {
			return this._queryRegistry.queryEntities(filter, options);
		},

		queryComponents(components, filter) {
			return this._queryRegistry.queryComponents(components, filter);
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
		},

		reset() {
			this._componentRegistry.reset();
			this._entityIndex.reset();
			this._queryRegistry.reset();
		}
	});
}

interface TCreateAppOptions<
	GPlugins extends TAnyPlugin[],
	GAppContext extends TAppContext<GPlugins> = TAppContext<GPlugins>
> {
	plugins?: GPlugins;
	systemSets?: GAppContext['systemSets'][];
	debug?: boolean;
}
