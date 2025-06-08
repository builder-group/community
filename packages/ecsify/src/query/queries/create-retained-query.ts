import { withNew } from '@blgc/utils';
import { TComponentRef } from '../../component';
import { TEntityId } from '../../entity';
import { categorizeEvaluationStrategy } from '../categorize-evaluation-strategy';
import { TQueryRegistry } from '../create-query-registry';
import { TQueryData } from '../types';
import { createQuery, isQuery, TCreateQueryOptions, TQuery } from './create-query';

/**
 * Creates a retained query that accumulates component changes independently from the component registry.
 *
 * Perfect for throttled systems that need to see ALL changes since their last execution,
 * even if component registry has been flushed multiple times between executions.
 *
 * Note: Highly experimental, may change in the future.
 *
 * @example
 * ```typescript
 * // Throttled rendering system that runs every 3 frames
 * const changedTransforms = createRetainedQuery(
 *   queryRegistry,
 *   Changed(Transform),
 *   { resetBehavior: 'reset' } // Start fresh after each execution
 * );
 *
 * // Frame 1: Transform changes, registry flushes
 * // Frame 2: More Transform changes, registry flushes
 * // Frame 3: Rendering system runs
 * const entities = changedTransforms.execute(); // Sees ALL changes from frames 1-3
 * ```
 *
 * @param queryRegistry - The query registry to use
 * @param filter - The query filter
 * @param options - Configuration options
 * @returns A retained query instance
 */
export function createRetainedQuery(
	queryRegistry: TQueryRegistry,
	filter: TQueryData['filter'],
	options: TRetainedQueryOptions = {}
): TRetainedQuery {
	const {
		evaluationStrategy = categorizeEvaluationStrategy(filter),
		key = filter.toString(queryRegistry._componentRegistry),
		register = true,
		resetBehavior = 'reset'
	} = options;

	const query: TRetainedQuery = withNew<TRetainedQuery, [TQueryData['filter']]>(
		{
			...createQuery(queryRegistry, filter, { evaluationStrategy, key, register: false }),
			_addedMasks: [[]],
			_changedMasks: [[]],
			_removedMasks: [[]],
			_resetBehavior: resetBehavior,
			_trackedComponents: [],

			_new(filter) {
				this._registerComponentFilters(filter);
				this._syncFromRegistry();
			},

			// TODO: Improve swapping component registry masks feels dirty
			execute() {
				// Temporarily swap component registry masks with our retained masks
				const originalAdded = this._componentRegistry._addedMasks;
				const originalChanged = this._componentRegistry._changedMasks;
				const originalRemoved = this._componentRegistry._removedMasks;

				this._componentRegistry._addedMasks = this._addedMasks;
				this._componentRegistry._changedMasks = this._changedMasks;
				this._componentRegistry._removedMasks = this._removedMasks;

				// Find matching entities
				const matchingEntities: TEntityId[] = [];
				for (let i = 0; i < this._entityIndex._aliveCount; i++) {
					const eid = this._entityIndex._dense[i];
					if (eid != null && this.filter.evaluate(this, eid)) {
						matchingEntities.push(eid);
					}
				}

				// Restore original masks
				this._componentRegistry._addedMasks = originalAdded;
				this._componentRegistry._changedMasks = originalChanged;
				this._componentRegistry._removedMasks = originalRemoved;

				// Reset state
				switch (this._resetBehavior) {
					case 'reset':
						this.reset();
						break;
					case 'sync':
						this.resetAndSync();
						break;
				}

				return matchingEntities;
			},

			_registerComponentFilters(filter) {
				switch (filter.type) {
					case 'Added': {
						this._trackedComponents.push({ component: filter.component, changeType: 'added' });
						this._componentRegistry.onComponentAdd(filter.component, (eid) => {
							this._accumulateChange(eid, filter.component, 'added');
						});
						break;
					}

					case 'Changed': {
						this._trackedComponents.push({ component: filter.component, changeType: 'changed' });
						this._componentRegistry.onComponentChange(filter.component, (eid) => {
							this._accumulateChange(eid, filter.component, 'changed');
						});
						break;
					}

					case 'Removed': {
						this._trackedComponents.push({ component: filter.component, changeType: 'removed' });
						this._componentRegistry.onComponentRemove(filter.component, (eid) => {
							this._accumulateChange(eid, filter.component, 'removed');
						});
						break;
					}

					case 'And':
					case 'Or': {
						for (const childFilter of filter.filters) {
							this._registerComponentFilters(childFilter);
						}
						break;
					}

					default:
					// do nothing
				}
			},

			_accumulateChange(eid, component, changeType) {
				const componentData = this._componentRegistry._componentMap.get(component);
				if (componentData == null) {
					return;
				}

				const { generationId, bitflag } = componentData;

				const targetMasks =
					changeType === 'added'
						? this._addedMasks
						: changeType === 'changed'
							? this._changedMasks
							: this._removedMasks;

				// Ensure mask arrays exist for this generation
				while (targetMasks.length <= generationId) {
					targetMasks.push([]);
				}

				// Accumulate the bit for this entity/component
				const currentMask = targetMasks[generationId]?.[eid] ?? 0;
				const targetGenMask = targetMasks[generationId];
				if (targetGenMask != null) {
					targetGenMask[eid] = currentMask | bitflag;
				}
			},

			_syncFromRegistry() {
				for (const { component, changeType } of this._trackedComponents) {
					const componentData = this._componentRegistry._componentMap.get(component);
					if (componentData == null) {
						continue;
					}

					const { generationId, bitflag } = componentData;
					const sourceMasks =
						changeType === 'added'
							? this._componentRegistry._addedMasks
							: changeType === 'changed'
								? this._componentRegistry._changedMasks
								: this._componentRegistry._removedMasks;

					const sourceGenMasks = sourceMasks[generationId];
					if (sourceGenMasks == null) {
						continue;
					}

					// Copy existing state for this component
					for (let eid = 0; eid < sourceGenMasks.length; eid++) {
						const mask = sourceGenMasks[eid];
						if (mask != null && (mask & bitflag) !== 0) {
							this._accumulateChange(eid, component, changeType);
						}
					}
				}
			},

			reset() {
				this._addedMasks.length = 0;
				this._addedMasks.push([]);
				this._changedMasks.length = 0;
				this._changedMasks.push([]);
				this._removedMasks.length = 0;
				this._removedMasks.push([]);
			},

			resetAndSync() {
				this.reset();
				this._syncFromRegistry();
			}
		},
		filter
	);

	// Register query if requested
	if (register) {
		queryRegistry.registerQuery(query);
	}

	return query;
}

export interface TRetainedQueryOptions extends TCreateQueryOptions {
	/**
	 * Determines how the retained state is reset after execution:
	 * - 'reset': Clear all retained changes (start fresh)
	 * - 'sync': Reset and sync to current component registry state
	 *
	 * @default 'reset'
	 */
	resetBehavior?: 'reset' | 'sync';
}

export interface TRetainedQuery extends TQuery {
	/** Retained added component masks by generation */
	_addedMasks: number[][];
	/** Retained changed component masks by generation */
	_changedMasks: number[][];
	/** Retained removed component masks by generation */
	_removedMasks: number[][];
	/** Reset behavior configuration */
	_resetBehavior: 'reset' | 'sync';
	/** Components being tracked by this retained query */
	_trackedComponents: Array<{
		component: TComponentRef;
		changeType: 'added' | 'changed' | 'removed';
	}>;

	/**
	 * Register component filter callbacks and start tracking.
	 * @internal
	 */
	_registerComponentFilters(filter: TQueryData['filter']): void;

	/**
	 * Accumulate a component change in query-specific masks.
	 * @internal
	 */
	_accumulateChange(
		eid: number,
		component: TComponentRef,
		changeType: 'added' | 'changed' | 'removed'
	): void;

	/**
	 * Sync current component registry state to query masks.
	 * @internal
	 */
	_syncFromRegistry(): void;

	/**
	 * Clear all retained changes (reset to empty state).
	 */
	reset(): void;

	/**
	 * Reset state and sync from current component registry.
	 */
	resetAndSync(): void;
}

export function isRetainedQuery(value: unknown): value is TRetainedQuery {
	return isQuery(value) && '_trackedComponents' in value && Array.isArray(value._trackedComponents);
}
