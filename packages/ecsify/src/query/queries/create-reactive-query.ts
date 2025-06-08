import { categorizeEvaluationStrategy } from '../categorize-evaluation-strategy';
import { TQueryRegistry } from '../create-query-registry';
import { TQueryData } from '../types';
import { createQuery, isQuery, TCreateQueryOptions, TQuery } from './create-query';

/**
 * Creates a reactive query that notifies callbacks when it becomes dirty.
 *
 * @param queryRegistry - The query registry to use
 * @param filter - The query filter
 * @param options - Configuration options
 * @returns A reactive query instance
 */
export function createReactiveQuery(
	queryRegistry: TQueryRegistry,
	filter: TQueryData['filter'],
	options: TCreateReactiveQueryOptions = {}
): TReactiveQuery {
	const {
		evaluationStrategy = categorizeEvaluationStrategy(filter),
		key = filter.toString(queryRegistry._componentRegistry),
		register = true
	} = options;

	const query: TReactiveQuery = {
		...createQuery(queryRegistry, filter, { evaluationStrategy, key, register: false }),
		_callbacks: [],

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

	// Register query if requested
	if (register) {
		queryRegistry.registerQuery(query);
	}

	return query;
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
