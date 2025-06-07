import { TComponentRef, TComponentValue } from '../component';
import { TEntityId } from '../entity';
import { TQueryFilter } from './query-filters';

/**
 * Special entity symbol for component queries
 */
export const Entity = Symbol('Entity');
export type TEntity = typeof Entity;

export interface TQueryData {
	/** Unique key identifying this query filter combination */
	key: string;
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

	/** Combined AND masks for all filter types (AND logic: entity must satisfy ALL requirements) */
	andMasks?: Record<
		number,
		{
			with?: number; // Components entity must HAVE (all)
			without?: number; // Components entity must LACK (all)
			added?: number; // Components entity ADDED this frame (all)
			changed?: number; // Components entity CHANGED this frame (all)
			removed?: number; // Components entity REMOVED this frame (all)
		}
	>;

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

	/** Components that can affect this query - enables O(1) invalidation checks */
	affectedMasks?: Record<number, number>;
}

export type TQueryComponentValue<GComponent extends TComponentRef | TEntity> =
	GComponent extends TEntity ? TEntityId : TComponentValue<GComponent>;
