import type { TEnforceFeatures, TFeatureKeys, TSelectFeatures, TState } from '../types';

export const FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER = null;

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
	GSelectedFeatureKeys extends TFeatureKeys<GValue>[],
	GStorageValue extends GValue = GValue
>(
	state: TState<GValue, TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	storage: TStorageInterface<GStorageValue>,
	key: string
): TState<GValue, [...GSelectedFeatureKeys, 'persist']> {
	const persistFeature: TSelectFeatures<GValue, ['persist']> = {
		async persist() {
			// Load persisted value or store inital value
			let success = await this.loadFormStorage();
			if (!success) {
				success = await storage.save(key, state._value as GStorageValue);
			}

			// Setup listener
			state.listen(
				async ({ value }) => {
					await storage.save(key, value as GStorageValue);
				},
				{ key: 'with-persist' }
			);

			return success;
		},
		async loadFormStorage() {
			let success = false;

			const persistedValue = await storage.load(key);
			if (persistedValue !== FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER) {
				state.set(persistedValue);
				success = true;
			}

			return success;
		},
		async deleteFormStorage() {
			return storage.delete(key);
		}
	};

	// Merge existing features from the state with the new persist feature
	const _state = Object.assign(state, persistFeature) as TState<
		GValue,
		[...GSelectedFeatureKeys, 'persist']
	>;
	_state._features.push('persist');

	return _state;
}
