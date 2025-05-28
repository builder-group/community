import { TComponentRef } from './component-registry';

// Filter types for different query operations
export type TFilter =
	| { type: 'With'; component: TComponentRef }
	| { type: 'Without'; component: TComponentRef }
	| { type: 'Added'; component: TComponentRef }
	| { type: 'Changed'; component: TComponentRef }
	| { type: 'Removed'; component: TComponentRef }
	| { type: 'And'; filters: TFilter[] }
	| { type: 'Or'; filters: TFilter[] }
	| { type: 'Not'; filters: TFilter[] };

// Component filter constructors
export const With = <T extends TComponentRef>(component: T): TFilter => ({
	type: 'With',
	component
});

export const Without = <T extends TComponentRef>(component: T): TFilter => ({
	type: 'Without',
	component
});

export const Added = <T extends TComponentRef>(component: T): TFilter => ({
	type: 'Added',
	component
});

export const Changed = <T extends TComponentRef>(component: T): TFilter => ({
	type: 'Changed',
	component
});

export const Removed = <T extends TComponentRef>(component: T): TFilter => ({
	type: 'Removed',
	component
});

// Logical filter constructors
export const And = (...filters: TFilter[]): TFilter => ({
	type: 'And',
	filters
});

export const All = And; // Alias for And

export const Or = (...filters: TFilter[]): TFilter => ({
	type: 'Or',
	filters
});

export const Any = Or; // Alias for Or

export const Not = (...filters: TFilter[]): TFilter => ({
	type: 'Not',
	filters
});

export const None = Not; // Alias for Not

// Special entity symbol for queries
export const Entity = Symbol('Entity');

// Query term can be a component or a filter
export type TQueryTerm = TComponentRef | TFilter;
