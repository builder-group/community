import { TComponentRef } from '../component';
import { TEntityId } from '../entity';
import { TWorld } from '../world';

export interface TQueryData {
	/** Unique hash identifying this query filter combination */
	hash: string;
	/** The original query filter that was compiled into this data */
	filter: TQueryFilter;
	/**
	 * Pre-computed evaluation strategy for optimal performance:
	 * - 'bitmask': Fast bitwise operations for component/change filters
	 * - 'individual': Filter-by-filter evaluation for complex queries
	 */
	evaluationStrategy: 'bitmask' | 'individual';

	/** Cached array of entity IDs that match this query */
	cachedResult: TEntityId[];
	/** True when cached results are stale and need re-evaluation */
	isDirty: boolean;

	/** Pre-computed generations array for optimal bitmask iteration */
	generations: number[];

	/** Bitmasks for required components (AND logic: entity must have ALL) */
	withMasks?: Record<number, number>;
	/** Bitmasks for forbidden components (AND logic: entity must have NONE) */
	withoutMasks?: Record<number, number>;

	/** Combined OR masks for all filter types (OR logic: entity must satisfy AT LEAST ONE per type) */
	orMasks?: Record<
		number,
		{
			with?: number; // Components entity must HAVE (any)
			without?: number; // Components entity must LACK (any)
			added?: number; // Components entity ADDED this frame (any)
			changed?: number; // Components entity CHANGED this frame (any)
			removed?: number; // Components entity REMOVED this frame (any)
		}
	>;

	/** Bitmasks for change detection (AND logic: entity must have ALL changed) */
	addedMasks?: Record<number, number>;
	changedMasks?: Record<number, number>;
	removedMasks?: Record<number, number>;

	/** Components that can affect this query - enables O(1) invalidation checks */
	affectedMasks?: Record<number, number>;
}

export interface TBaseQueryFilter {
	type: string;
	evaluate(world: TWorld, eid: TEntityId, queryData: TQueryData): boolean;
	register?(world: TWorld, queryData: TQueryData): void;
	getHash(world: TWorld): string;
}

export type TQueryFilter =
	| (TBaseQueryFilter & { type: 'With'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'Without'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'Added'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'Changed'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'Removed'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'And'; filters: TQueryFilter[] })
	| (TBaseQueryFilter & { type: 'Or'; filters: TQueryFilter[] });
