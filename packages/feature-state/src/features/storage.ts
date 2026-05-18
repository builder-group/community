import { defineFeature, type TFeature } from 'feature-core';
import type { TStateBase } from '../types';

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
		install(state: TStateBase<GValue>) {
			async function loadFromStorage(): Promise<boolean> {
				let success = false;

				const persistedValue = await storage.load(key);
				if (persistedValue !== missingStorageValue) {
					state.set(persistedValue, {
						listenerContext: { source: loadFromStorageSourceKey }
					});
					success = true;
				}

				return success;
			}

			let listening = false;

			return {
				async persist() {
					let success = await loadFromStorage();
					if (!success) {
						success = await storage.save(key, state.value as GStorageValue);
					}

					// Note: guard prevents registering a duplicate listener if persist() is called more than once
					if (!listening) {
						listening = true;
						state.listen(async ({ value, source }) => {
							if (source !== loadFromStorageSourceKey) {
								await storage.save(key, value as GStorageValue);
							}
						});
					}

					return success;
				},
				loadFromStorage,
				async deleteFromStorage() {
					return storage.delete(key);
				}
			};
		}
	});
}

/** Sentinel returned by `TStorageInterface.load` when no value is stored for a key. */
export const missingStorageValue = null;
/** Source key set on the listener context when a value is restored from storage. */
export const loadFromStorageSourceKey = 'loadFromStorage';

export type TStorageFeature = TFeature<
	'storage',
	{
		persist(): Promise<boolean>;
		loadFromStorage(): Promise<boolean>;
		deleteFromStorage(): Promise<boolean>;
	}
>;

/**
 * Minimal storage adapter required by `storageFeature`.
 * `load` must return `null` (via `missingStorageValue`) when
 * the key is absent, not `undefined` or a thrown error.
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
