import type { TEnforceFeatures, TFeatureKeys, TSelectFeatures, TState } from '../types';

export const FAILED_TO_LOAD_IDENTIFIER = undefined;

export interface StorageInterface<GStorageValue> {
	save: (key: string, value: GStorageValue) => Promise<boolean> | boolean;
	load: (
		key: string
	) =>
		| Promise<GStorageValue | typeof FAILED_TO_LOAD_IDENTIFIER>
		| GStorageValue
		| typeof FAILED_TO_LOAD_IDENTIFIER;
	delete: (key: string) => Promise<boolean> | boolean;
}

export function withPersist<
	GValue,
	GSelectedFeatureKeys extends TFeatureKeys<GValue>[],
	// TODO: For whatever reason Typescript infers type from storage and not state argument
	// thus I need this extra GStorageValue
	GStorageValue extends GValue = GValue
>(
	state: TState<GValue, TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	storage: StorageInterface<GStorageValue>,
	key: string
): TState<GValue, [...GSelectedFeatureKeys, 'persist']> {
	state._features.push('persist');

	const persistFeature: TSelectFeatures<GValue, ['persist']> = {
		async persist() {
			let success = false;

			// Load persisted value or store inital value
			const persistedValue = await storage.load(key);
			if (persistedValue !== FAILED_TO_LOAD_IDENTIFIER) {
				state.set(persistedValue);
				success = true;
			} else {
				success = await storage.save(key, state._value as GStorageValue);
			}

			// Setup listener
			state.listen(async (value) => {
				await storage.save(key, value as GStorageValue);
			});

			return success;
		},
		async deletePersisted() {
			return storage.delete(key);
		}
	};

	// Merge existing features from the state with the new persist feature
	return Object.assign(state, persistFeature) as TState<
		GValue,
		[...GSelectedFeatureKeys, 'persist']
	>;
}
