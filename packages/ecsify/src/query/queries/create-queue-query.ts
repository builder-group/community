import { TEntityId } from '../../entity';
import { TQueryRegistry } from '../create-query-registry';
import { TQueryData } from '../types';
import {
	createReactiveQuery,
	isReactiveQuery,
	TCreateReactiveQueryOptions,
	TReactiveQuery
} from './create-reactive-query';

export function createQueueQuery(
	queryRegistry: TQueryRegistry,
	filter: TQueryData['filter'],
	options: TCreateQueueQueryOptions = {}
): TQueueQuery {
	const { maxQueueSize = 5, ...reactiveQueryOptions } = options;

	const queueQuery: TQueueQuery = {
		...createReactiveQuery(queryRegistry, filter, reactiveQueryOptions),
		_entityQueue: [],
		maxQueueSize,

		register(queryRegistry, parentType) {
			this.filter.register?.(queryRegistry, this, parentType);

			this.onDirty(() => {
				// Query all matching entities
				const matchingEntities: TEntityId[] = [];
				for (let i = 0; i < queryRegistry._entityIndex._aliveCount; i++) {
					const eid = queryRegistry._entityIndex._dense[i];
					if (eid != null && this.filter.evaluate(queryRegistry, eid, this)) {
						matchingEntities.push(eid);
					}
				}

				// Push to queue
				this._entityQueue.push({
					entities: matchingEntities,
					timestamp: Date.now()
				});

				// Limit queue size
				if (this._entityQueue.length > this.maxQueueSize) {
					this._entityQueue.shift();
				}
			});
		},

		query(queryRegistry) {
			// Pop from queue if available
			const queued = this._entityQueue.shift();
			if (queued != null) {
				return queued.entities;
			}

			// Re-query all matching entities
			const matchingEntities: TEntityId[] = [];
			for (let i = 0; i < queryRegistry._entityIndex._aliveCount; i++) {
				const eid = queryRegistry._entityIndex._dense[i];
				if (eid != null && this.filter.evaluate(queryRegistry, eid, this)) {
					matchingEntities.push(eid);
				}
			}

			return matchingEntities;
		},

		cleanup() {
			this._callbacks = [];
			this._entityQueue = [];
		}
	};

	return queueQuery;
}

export interface TCreateQueueQueryOptions extends TCreateReactiveQueryOptions {
	/** Maximum number of entity sets to keep in queue (default: 5) */
	maxQueueSize?: number;
}

export interface TQueuedEntitySet {
	entities: TEntityId[];
	timestamp: number;
}

export interface TQueueQuery extends TReactiveQuery {
	/** Queue of pre-computed entity sets */
	_entityQueue: TQueuedEntitySet[];
	/** Maximum number of entity sets to keep in queue */
	maxQueueSize: number;

	/**
	 * Query entities - pops from queue if available, otherwise queries directly
	 * @param queryRegistry - The query registry to use
	 * @returns Array of entity IDs that match the query
	 */
	query(queryRegistry: TQueryRegistry): TEntityId[];
}

export function isQueueQuery(value: unknown): value is TQueueQuery {
	return isReactiveQuery(value) && '_entityQueue' in value && Array.isArray(value._entityQueue);
}
