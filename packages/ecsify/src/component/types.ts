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

/**
 * Infers the appropriate value type for different component patterns:
 * - Marker component: true
 * - Array of objects (AoS): { x: 10, y: 20 }
 * - Object with array properties (SoA): { x: 10, y: 20 }
 * - Single value array: 100
 */
export type TComponentValue<GComponent extends TComponentRef> =
	GComponent extends Record<string, never>
		? true // Marker component: {} -> true
		: GComponent extends (infer U)[]
			? U // AoS: { x: number; y: number }[] -> { x: number; y: number } or number[] -> number
			: GComponent extends Record<string, unknown[]>
				? { [K in keyof GComponent]: GComponent[K] extends (infer U)[] ? U : never } // SoA: { x: number[], y: number[] } -> { x: number, y: number }
				: never;

/**
 * Infers the appropriate value type for updateComponent operations:
 * - Marker component: boolean (true = add, false = remove)
 * - Array of objects (AoS): { x: 10, y: 20 } (full object replacement)
 * - Object with array properties (SoA): Partial<{ x: 10, y: 20 }> (can update subset)
 * - Single value array: 100 (full value replacement)
 */
export type TUpdateComponentValue<GComponent extends TComponentRef> =
	GComponent extends Record<string, never>
		? boolean // Marker component: {} -> boolean (true = add, false = remove)
		: GComponent extends (infer U)[]
			? U // AoS: { x: number; y: number }[] -> { x: number; y: number } or number[] -> number
			: GComponent extends Record<string, unknown[]>
				? Partial<{ [K in keyof GComponent]: GComponent[K] extends (infer U)[] ? U : never }> // SoA: { x: number[], y: number[] } -> { x?: number, y?: number }
				: never;
