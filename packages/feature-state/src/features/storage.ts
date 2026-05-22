import { defineFeature, type TFeature } from 'feature-core';
import type { TState } from '../types';

/**
 * Adds `persist()`, `loadFromStorage()`, and `deleteFromStorage()` to a state.
 *
 * `persist()` tries to load a previously saved value first; if none exists it
 * saves the current state instead. After that, every `set()` call saves the new
 * value automatically. Saves triggered by loading are skipped to prevent loops.
 */
export function storageFeature<GValue, GStorageValue extends GValue = GValue>(
	storage: TStorageInterface<GStorageValue>,
	key: string
): TStorageFeature {
	return defineFeature<TStorageFeature>({
		key: 'storage',
		install() {
			let listening = false;

			return {
				async persist(this: TState<GValue, [TStorageFeature]>) {
					let success = await this.loadFromStorage();
					if (!success) {
						success = await storage.save(key, this.value as GStorageValue);
					}

					// Note: Guard prevents registering a duplicate listener if persist() is called more than once
					if (!listening) {
						listening = true;
						this.listen(async ({ value, source }) => {
							if (source !== loadFromStorageSourceKey) {
								await storage.save(key, value as GStorageValue);
							}
						});
					}

					return success;
				},
				async loadFromStorage(this: TState<GValue, [TStorageFeature]>) {
					let success = false;

					const persistedValue = await storage.load(key);
					if (persistedValue !== missingStorageValue) {
						this.set(persistedValue, {
							listenerContext: { source: loadFromStorageSourceKey }
						});
						success = true;
					}

					return success;
				},
				async deleteFromStorage() {
					return storage.delete(key);
				}
			};
		}
	});
}

/** Sentinel returned by `TStorageInterface.load` when no value is stored for a key. */
export const missingStorageValue = Symbol('missingStorageValue');
/** Source key set on the listener context when a value is restored from storage. */
export const loadFromStorageSourceKey = 'loadFromStorage';

export type TStorageFeature = TFeature<'storage', TStorageFeatureApi>;

export interface TStorageFeatureApi {
	/**
	 * Loads the persisted value if one exists, otherwise saves the current value.
	 * After the first call, every `set()` saves automatically. Returns `true` on success.
	 * Safe to call multiple times: registers the auto-save listener only once.
	 */
	persist(): Promise<boolean>;
	/** Loads the persisted value and updates the state. Returns `true` if a value was found. */
	loadFromStorage(): Promise<boolean>;
	/** Deletes the persisted value from storage. Returns `true` on success. */
	deleteFromStorage(): Promise<boolean>;
}

/**
 * Minimal storage adapter required by `storageFeature`.
 * `load` must return `missingStorageValue` when the key is absent.
 * `null` and `undefined` are treated as stored values.
 */
export interface TStorageInterface<GStorageValue> {
	save(key: string, value: GStorageValue): Promise<boolean> | boolean;
	load(
		key: string
	):
		| Promise<GStorageValue | typeof missingStorageValue>
		| GStorageValue
		| typeof missingStorageValue;
	delete(key: string): Promise<boolean> | boolean;
}
