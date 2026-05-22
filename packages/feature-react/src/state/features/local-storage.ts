import {
	missingStorageValue,
	storageFeature,
	type TStorageFeature,
	type TStorageInterface
} from 'feature-state';

/**
 * Adds `persist()`, `loadFromStorage()`, and `deleteFromStorage()` to a state,
 * backed by browser `localStorage`.
 *
 * Values are serialized with `JSON.stringify` and deserialized with `JSON.parse`.
 * Returns `false` silently when `localStorage` is unavailable (SSR, private mode).
 * See `storageFeature` in `feature-state` for the full `persist()` contract.
 *
 * @param key - The `localStorage` key under which the value is stored.
 */
export function localStorageFeature<GValue, GStorageValue extends GValue = GValue>(
	key: string
): TStorageFeature {
	return storageFeature<GValue, GStorageValue>(createLocalStorageInterface<GStorageValue>(), key);
}

function createLocalStorageInterface<GStorageValue>(): TStorageInterface<GStorageValue> {
	return {
		save(key, value) {
			const storage = getLocalStorage();
			if (storage == null) {
				return false;
			}

			storage.setItem(key, JSON.stringify(value));
			return true;
		},
		load(key) {
			const storage = getLocalStorage();
			const item = storage?.getItem(key);
			if (item == null) {
				return missingStorageValue;
			}

			return JSON.parse(item) as GStorageValue;
		},
		delete(key) {
			const storage = getLocalStorage();
			if (storage == null) {
				return false;
			}

			storage.removeItem(key);
			return true;
		}
	};
}

function getLocalStorage(): Storage | null {
	return typeof localStorage === 'undefined' ? null : localStorage;
}
