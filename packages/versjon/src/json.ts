/**
 * Accepts acyclic JSON values with finite numbers, plain or null-prototype objects and dense
 * arrays without extra enumerable properties.
 * Rejects object and array nesting deeper than 100 levels.
 */
export function isJsonValue(value: unknown): value is TJsonValue {
	return isJsonValueWithAncestors(value, new Set<object>(), 0);
}

function isJsonValueWithAncestors(
	value: unknown,
	ancestors: Set<object>,
	depth: number
): value is TJsonValue {
	if (value === null || typeof value === 'boolean' || typeof value === 'string') {
		return true;
	}

	if (typeof value === 'number') {
		return Number.isFinite(value);
	}

	if (typeof value !== 'object' || ancestors.has(value) || depth > maxJsonDepth) {
		return false;
	}

	ancestors.add(value);
	let isJson: boolean;
	if (Array.isArray(value)) {
		// Note: JSON arrays are dense and cannot preserve custom enumerable properties
		const keys = Object.keys(value);
		isJson =
			keys.length === value.length &&
			keys.every((key, index) => key === index.toString()) &&
			value.every((entry) => isJsonValueWithAncestors(entry, ancestors, depth + 1));
	} else {
		const prototype = Object.getPrototypeOf(value);
		isJson =
			(prototype === Object.prototype || prototype === null) &&
			Object.values(value).every((entry) => isJsonValueWithAncestors(entry, ancestors, depth + 1));
	}
	ancestors.delete(value);
	return isJson;
}

const maxJsonDepth = 100;

/** Accepts JSON objects whose nested values also satisfy the JSON constraints. */
export function isJsonObject(value: unknown): value is TJsonObject {
	return value != null && typeof value === 'object' && !Array.isArray(value) && isJsonValue(value);
}

/**
 * Copies a validated JSON value without sharing nested object or array references.
 * Check unknown values with `isJsonValue()` before cloning them.
 */
export function cloneJson<GValue extends TJsonValue>(value: GValue): GValue {
	if (Array.isArray(value)) {
		return value.map((entry) => cloneJson(entry)) as GValue;
	}

	if (value != null && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, entry]) => [key, cloneJson(entry)])
		) as GValue;
	}

	return value;
}

/** Compares validated JSON values structurally while ignoring object property order. */
export function areJsonValuesEqual(left: TJsonValue, right: TJsonValue): boolean {
	if (left === right) {
		return true;
	}

	if (Array.isArray(left) || Array.isArray(right)) {
		return (
			Array.isArray(left) &&
			Array.isArray(right) &&
			left.length === right.length &&
			left.every((entry, index) => {
				const rightEntry = right[index];
				return rightEntry !== undefined && areJsonValuesEqual(entry, rightEntry);
			})
		);
	}

	if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') {
		return false;
	}

	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	return (
		leftKeys.length === rightKeys.length &&
		leftKeys.every((key) => {
			const leftValue = left[key];
			if (!Object.hasOwn(right, key)) {
				return false;
			}

			const rightValue = right[key];
			return (
				leftValue !== undefined &&
				rightValue !== undefined &&
				areJsonValuesEqual(leftValue, rightValue)
			);
		})
	);
}

/** Use `isJsonValue()` to check runtime constraints that this type cannot express. */
export type TJsonValue = TJsonPrimitive | TJsonObject | TJsonValue[];

export type TJsonPrimitive = boolean | null | number | string;

export interface TJsonObject {
	[key: string]: TJsonValue;
}
