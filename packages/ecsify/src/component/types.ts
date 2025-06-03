import { TEntityId } from '../entity';

export interface TComponentData {
	/** Unique component ID */
	id: number;
	/** Generation ID (which mask array this component uses) */
	generationId: number;
	/** Bitflag for this component (power of 2) */
	bitflag: number;
	/** Reference to the component object */
	ref: TComponentRef;
}

export type TComponentRef = any; // Can be array or object with arrays

export interface TComponentCallbacks {
	onAdd?: ((eid: TEntityId) => void)[];
	onChange?: ((eid: TEntityId) => void)[];
	onRemove?: ((eid: TEntityId) => void)[];
	onFlush?: (() => void)[];
}

/**
 * Infers the appropriate value type for different component patterns:
 * - Marker component: true
 * - Object with array properties (AoS): { x: 10, y: 20 }
 * - Array of objects (SoA): { x: 10, y: 20 }
 * - Single value array: 100
 */
export type TComponentValue<GComponent extends TComponentRef> =
	GComponent extends Record<string, never>
		? true // Marker component: {} -> true
		: GComponent extends (infer U)[]
			? U // SoA: { x: number; y: number }[] -> { x: number; y: number } or number[] -> number
			: GComponent extends Record<string, unknown[]>
				? { [K in keyof GComponent]: GComponent[K] extends (infer U)[] ? U : never } // AoS: { x: number[], y: number[] } -> { x: number, y: number }
				: never;

/**
 * Infers the appropriate value type for updateComponent operations:
 * - Marker component: boolean (true = add, false = remove)
 * - Object with array properties (AoS): Partial<{ x: 10, y: 20 }> (can update subset)
 * - Array of objects (SoA): { x: 10, y: 20 } (full object replacement)
 * - Single value array: 100 (full value replacement)
 */
export type TUpdateComponentValue<GComponent extends TComponentRef> =
	GComponent extends Record<string, never>
		? boolean // Marker component: {} -> boolean (true = add, false = remove)
		: GComponent extends (infer U)[]
			? U // SoA: { x: number; y: number }[] -> { x: number; y: number } or number[] -> number
			: GComponent extends Record<string, unknown[]>
				? Partial<{ [K in keyof GComponent]: GComponent[K] extends (infer U)[] ? U : never }> // AoS: { x: number[], y: number[] } -> { x?: number, y?: number }
				: never;
