import { TComponentRef } from './component-registry';

export type TGetComponentId = (component: TComponentRef) => number;

/**
 * A query filter represents a condition used to select entities in ECS queries.
 * Query filters can be simple conditions (With, Without) or complex combinations (And, Or, Not).
 */
export type TQueryFilter =
	| { type: 'With'; component: TComponentRef; toString(getComponentId: TGetComponentId): string }
	| { type: 'Without'; component: TComponentRef; toString(getComponentId: TGetComponentId): string }
	| { type: 'Added'; component: TComponentRef; toString(getComponentId: TGetComponentId): string }
	| { type: 'Changed'; component: TComponentRef; toString(getComponentId: TGetComponentId): string }
	| { type: 'Removed'; component: TComponentRef; toString(getComponentId: TGetComponentId): string }
	| { type: 'And'; filters: TQueryFilter[]; toString(getComponentId: TGetComponentId): string }
	| { type: 'Or'; filters: TQueryFilter[]; toString(getComponentId: TGetComponentId): string }
	| { type: 'Not'; filters: TQueryFilter[]; toString(getComponentId: TGetComponentId): string }
	| { type: 'None'; toString(): string };

export const With = <T extends TComponentRef>(component: T): TQueryFilter => ({
	type: 'With',
	component,
	toString(getComponentId) {
		return `with(${getComponentId(component)})`;
	}
});

export const Without = <T extends TComponentRef>(component: T): TQueryFilter => ({
	type: 'Without',
	component,
	toString(getComponentId) {
		return `without(${getComponentId(component)})`;
	}
});

export const Added = <T extends TComponentRef>(component: T): TQueryFilter => ({
	type: 'Added',
	component,
	toString(getComponentId) {
		return `added(${getComponentId(component)})`;
	}
});

export const Changed = <T extends TComponentRef>(component: T): TQueryFilter => ({
	type: 'Changed',
	component,
	toString(getComponentId) {
		return `changed(${getComponentId(component)})`;
	}
});

export const Removed = <T extends TComponentRef>(component: T): TQueryFilter => ({
	type: 'Removed',
	component,
	toString(getComponentId) {
		return `removed(${getComponentId(component)})`;
	}
});

export const And = (...filters: TQueryFilter[]): TQueryFilter => ({
	type: 'And',
	filters,
	toString(getComponentId) {
		return `and(${filters.map((f) => f.toString(getComponentId)).join(',')})`;
	}
});

export const All = And; // Alias for And

export const Or = (...filters: TQueryFilter[]): TQueryFilter => ({
	type: 'Or',
	filters,
	toString(getComponentId) {
		return `or(${filters.map((f) => f.toString(getComponentId)).join(',')})`;
	}
});

export const Any = Or; // Alias for Or

export const Not = (...filters: TQueryFilter[]): TQueryFilter => ({
	type: 'Not',
	filters,
	toString(getComponentId: TGetComponentId) {
		return `not(${filters.map((f) => f.toString(getComponentId)).join(',')})`;
	}
});

export const None = (): TQueryFilter => ({
	type: 'None',
	toString() {
		return 'none()';
	}
});

// Special entity symbol for queries
// TODO: Put into query-data or so?
export const Entity = Symbol('Entity');

/**
 * Type guard to check if a value is a query filter.
 */
export function isQueryFilter(value: any): value is TQueryFilter {
	return (
		typeof value === 'object' &&
		value !== null &&
		'type' in value &&
		typeof value.type === 'string' &&
		['With', 'Without', 'Added', 'Changed', 'Removed', 'And', 'Or', 'Not', 'None'].includes(
			value.type
		)
	);
}
