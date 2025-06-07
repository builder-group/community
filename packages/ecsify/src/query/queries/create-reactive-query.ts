import { categorizeEvaluationStrategy } from '../categorize-evaluation-strategy';
import { TQueryRegistry } from '../create-query-registry';
import { TQueryData } from '../types';
import { isQuery, TCreateQueryOptions, TQuery } from './create-query';

export function createReactiveQuery(
	queryRegistry: TQueryRegistry,
	filter: TQueryData['filter'],
	options: TCreateReactiveQueryOptions = {}
): TReactiveQuery {
	const {
		evaluationStrategy = categorizeEvaluationStrategy(filter),
		hash = filter.getHash(queryRegistry)
	} = options;

	return {
		filter,
		evaluationStrategy,
		hash,
		cachedResult: [],
		isDirty: true,
		generations: [],
		_callbacks: [],
		evaluate(queryRegistry, eid) {
			return this.filter.evaluate(queryRegistry, eid, this);
		},
		register(queryRegistry, parentType) {
			this.filter.register?.(queryRegistry, this, parentType);
		},
		getHash(queryRegistry) {
			return this.filter.getHash(queryRegistry);
		},
		markDirty() {
			this.isDirty = true;
			for (const callback of this._callbacks) {
				callback();
			}
		},
		onDirty(callback) {
			this._callbacks.push(callback);
			return () => {
				const index = this._callbacks.indexOf(callback);
				if (index != null && index !== -1) {
					this._callbacks.splice(index, 1);
				}
			};
		},
		cleanup() {
			this._callbacks = [];
		}
	};
}

export interface TCreateReactiveQueryOptions extends TCreateQueryOptions {}

export interface TReactiveQuery extends TQuery {
	/** Registered callbacks that fire when query becomes dirty */
	_callbacks: (() => void)[];

	/**
	 * Register callback that fires when query becomes dirty
	 * @param callback Function to call when query needs re-evaluation
	 * @returns Unregister function
	 */
	onDirty(callback: () => void): () => void;

	/**
	 * Clean up all registered callbacks
	 */
	cleanup(): void;
}

export function isReactiveQuery(value: unknown): value is TReactiveQuery {
	return isQuery(value) && '_callbacks' in value && Array.isArray(value._callbacks);
}
