import {
	FAILED_TO_LOAD_IDENTIFIER,
	withPersist,
	type StorageInterface,
	type TEnforceFeatures,
	type TFeatureKeys,
	type TState
} from 'feature-state';

class LocalStorageInterface<GValue> implements StorageInterface<GValue> {
	async save(key: string, value: GValue): Promise<boolean> {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	}

	async load(key: string): Promise<GValue | typeof FAILED_TO_LOAD_IDENTIFIER> {
		const item = localStorage.getItem(key);
		return item ? (JSON.parse(item) as GValue) : FAILED_TO_LOAD_IDENTIFIER;
	}

	async delete(key: string): Promise<boolean> {
		localStorage.removeItem(key);
		return true;
	}
}

export function withPersistLocalStorage<
	GValue,
	GSelectedFeatureKeys extends TFeatureKeys<GValue>[]
>(
	state: TState<GValue, TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	key: string
): TState<GValue, [...GSelectedFeatureKeys, 'persist']> {
	return withPersist(state, new LocalStorageInterface<GValue>(), key);
}
