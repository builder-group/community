import {
	FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER,
	withStorage,
	type TEnforceFeatures,
	type TFeatureKeys,
	type TState,
	type TStorageInterface
} from 'feature-state';

class LocalStorageInterface<GStorageValue> implements TStorageInterface<GStorageValue> {
	save(key: string, value: GStorageValue): boolean {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	}
	load(key: string): GStorageValue | typeof FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER {
		const item = localStorage.getItem(key);
		return item !== null
			? (JSON.parse(item) as GStorageValue)
			: FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER;
	}
	delete(key: string): boolean {
		localStorage.removeItem(key);
		return true;
	}
}

export function withLocalStorage<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]>(
	state: TState<GValue, TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	key: string
): TState<GValue, [...GSelectedFeatureKeys, 'persist']> {
	return withStorage(state, new LocalStorageInterface<GValue>(), key);
}
