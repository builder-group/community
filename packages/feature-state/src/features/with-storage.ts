import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import type { TPersistFeature, TState } from '../types';

export const FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER = null;
export const LOAD_FROM_STORAGE_SOURCE_KEY = 'loadFromStorage';

export interface TStorageInterface<GStorageValue> {
	save: (key: string, value: GStorageValue) => Promise<boolean> | boolean;
	load: (
		key: string
	) =>
		| Promise<GStorageValue | typeof FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER>
		| GStorageValue
		| typeof FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER;
	delete: (key: string) => Promise<boolean> | boolean;
}

export function withStorage<
	GValue,
	GFeatures extends TFeatureDefinition[],
	GStorageValue extends GValue = GValue
>(
	state: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, []>,
	storage: TStorageInterface<GStorageValue>,
	key: string
): TState<GValue, [TPersistFeature, ...GFeatures]> {
	const persistFeature: TPersistFeature['api'] = {
		async persist() {
			// Load persisted value or store inital value
			let success = await this.loadFormStorage();
			if (!success) {
				success = await storage.save(key, state._v as GStorageValue);
			}

			// Setup listener
			state.listen(
				async ({ value, source }) => {
					if (source !== LOAD_FROM_STORAGE_SOURCE_KEY) {
						await storage.save(key, value as GStorageValue);
					}
				},
				{ key: 'with-persist' }
			);

			return success;
		},
		async loadFormStorage() {
			let success = false;

			const persistedValue = await storage.load(key);
			if (persistedValue !== FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER) {
				state.set(persistedValue, { additionalData: { source: LOAD_FROM_STORAGE_SOURCE_KEY } });
				success = true;
			}

			return success;
		},
		async deleteFormStorage() {
			return storage.delete(key);
		}
	};

	// Merge existing features from the state with the new persist feature
	const _state = Object.assign(state, persistFeature) as TState<GValue, [TPersistFeature]>;
	_state._features.push('persist');

	return _state as unknown as TState<GValue, [TPersistFeature, ...GFeatures]>;
}
