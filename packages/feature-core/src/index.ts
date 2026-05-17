/**
 * Adds feature metadata and `.with()` to a plain object.
 *
 * Mutates and returns the provided object.
 */
export function createFeatureHost<GBase extends object>(base: GBase): TFeatureHost<GBase, []> {
	assertBaseCanBecomeFeatureHost(base);

	return Object.assign(base, {
		_features: [],
		with: withFeature
	}) as TFeatureHost<GBase, []>;
}

/**
 * Defines a composable feature that can be installed on a feature host.
 *
 * Pass the feature type explicitly to get typed install host and validated `requires`:
 * ```ts
 * defineFeature<TMyFeature>({ key: 'my-feature', install(host) { ... } })
 * ```
 */
export function defineFeature<const GKey extends string, GApi extends object>(definition: {
	key: GKey;
	install: (host: never) => GApi;
}): TFeature<GKey, GApi>;
export function defineFeature<GFeature extends TAnyFeature>(
	definition: TFeatureDefinition<GFeature>
): GFeature;
export function defineFeature(definition: {
	key: string;
	requires?: readonly string[];
	install: (host: never) => object;
}): TAnyFeature {
	return {
		key: definition.key,
		requires: definition.requires ?? [],
		install: definition.install
	};
}

/**
 * Installs one feature on a host.
 *
 * Mutates and returns the host. Throws when requirements are missing, the feature is already
 * installed, or the feature API would overwrite an existing property.
 */
export function installFeature<
	GBase extends object,
	GInstalledFeatures extends TAnyFeature[],
	GFeatureToInstall extends TAnyFeature
>(
	host: TFeatureHost<GBase, GInstalledFeatures>,
	feature: GFeatureToInstall & TInstallableFeature<GFeatureToInstall, GInstalledFeatures>
): TFeatureHost<GBase, [...GInstalledFeatures, GFeatureToInstall]> {
	assertRequiredFeaturesInstalled(host, feature);
	assertFeatureNotInstalled(host, feature);

	const api = feature.install(host as never);
	assertFeatureApiCanBeAssignedToHost(host, feature, api);
	Object.assign(host, api);
	(host._features as string[]).push(feature.key);

	return host as unknown as TFeatureHost<GBase, [...GInstalledFeatures, GFeatureToInstall]>;
}

/**
 * Checks whether a value is a feature host with a specific installed feature.
 */
export function hasFeature<GFeature extends TAnyFeature>(
	host: unknown,
	key: GFeature['key']
): host is TFeatureHost<object, [GFeature]>;
export function hasFeature<GKey extends string>(
	host: unknown,
	key: GKey
): host is TFeatureHost<object, [TFeature<GKey, object>]>;
export function hasFeature(host: unknown, key: string): boolean {
	if (typeof host !== 'object' || host == null) {
		return false;
	}
	if (!('_features' in host) || !Array.isArray(host._features)) {
		return false;
	}
	if (!('with' in host) || typeof host.with !== 'function') {
		return false;
	}

	return host._features.includes(key);
}

function withFeature(
	this: TFeatureHost<object, TAnyFeature[]>,
	...features: TAnyFeature[]
): TFeatureHost<object, TAnyFeature[]> {
	for (const feature of features) {
		// Note: The public `.with()` signature validates order; runtime checks handle this body
		installFeature(this, feature as TFeature<string, object>);
	}

	return this;
}

function assertRequiredFeaturesInstalled(
	host: TFeatureHost<object, TAnyFeature[]>,
	feature: TAnyFeature
): void {
	const missingFeatureKey = feature.requires.find((key) => !host._features.includes(key));
	if (missingFeatureKey != null) {
		throw new Error(`Feature "${feature.key}" requires missing feature "${missingFeatureKey}"`);
	}
}

function assertFeatureNotInstalled(
	host: TFeatureHost<object, TAnyFeature[]>,
	feature: TAnyFeature
): void {
	if (host._features.includes(feature.key)) {
		throw new Error(`Feature "${feature.key}" is already installed`);
	}
}

function assertFeatureApiCanBeAssignedToHost(
	host: TFeatureHost<object, TAnyFeature[]>,
	feature: TAnyFeature,
	api: object
): void {
	for (const key of Reflect.ownKeys(api)) {
		if (key in host) {
			throw new Error(
				`Feature "${feature.key}" cannot overwrite existing property "${String(key)}"`
			);
		}
	}
}

function assertBaseCanBecomeFeatureHost(base: object): void {
	for (const key of reservedFeatureHostKeys) {
		if (key in base) {
			throw new Error(`Feature host cannot overwrite existing property "${key}"`);
		}
	}
}

const reservedFeatureHostKeys = ['_features', 'with'] as const;

/**
 * A composable feature with a key, API contract, and optional required features.
 *
 * Declare feature types as named aliases for use across the codebase:
 * ```ts
 * type TResetFeature = TFeature<'reset', { reset(): void }>;
 * type TResetTwiceFeature = TFeature<'resetTwice', { resetTwice(): void }, [TResetFeature]>;
 * ```
 */
export interface TFeature<
	GKey extends string = string,
	GApi extends object = object,
	GRequiredFeatures extends readonly TAnyFeature[] = []
> {
	key: GKey;
	requires: TRequiredFeatureKeyTuple<GRequiredFeatures>;
	install: (host: never) => GApi;
}

/**
 * Structural feature type for generic implementation code.
 *
 * Note: A plain interface rather than `TFeature<string, object, TAnyFeature[]>` to avoid a
 * self-referential type definition.
 */
export interface TAnyFeature {
	key: string;
	requires: readonly string[];
	install: (host: never) => object;
}

/**
 * A base object extended with installed feature APIs and the `.with()` method.
 */
export type TFeatureHost<GBase extends object, GInstalledFeatures extends TAnyFeature[]> = Omit<
	GBase,
	keyof TFeatureHostApi<object, []>
> &
	TFeatureApiIntersection<GInstalledFeatures> &
	TFeatureHostApi<GBase, GInstalledFeatures>;

type TFeatureApiIntersection<GFeatures extends readonly TAnyFeature[]> =
	GFeatures extends readonly [
		infer GFeature extends TAnyFeature,
		...infer GRest extends TAnyFeature[]
	]
		? TFeatureApi<GFeature> & TFeatureApiIntersection<GRest>
		: object;

interface TFeatureHostApi<GBase extends object, GInstalledFeatures extends TAnyFeature[]> {
	/**
	 * @internal Feature metadata used by feature-core. Prefer `hasFeature()` for app code.
	 */
	readonly _features: readonly GInstalledFeatures[number]['key'][];
	with: TWithFeatureMethod<GBase, GInstalledFeatures>;
}

interface TWithFeatureMethod<GBase extends object, GInstalledFeatures extends TAnyFeature[]> {
	<const GFeaturesToInstall extends TAnyFeature[]>(
		...features: GFeaturesToInstall & TInstallableFeatures<GInstalledFeatures, GFeaturesToInstall>
	): TFeatureHost<GBase, [...GInstalledFeatures, ...GFeaturesToInstall]>;
}

// Note: GInstalledFeatures accumulates across the tuple so each feature validates against
// all previously listed features in the same .with() call, not just the initial installed set.
type TInstallableFeatures<
	GInstalledFeatures extends TAnyFeature[],
	GFeaturesToInstall extends TAnyFeature[]
> = GFeaturesToInstall extends [
	infer GFeatureToInstall extends TAnyFeature,
	...infer GRest extends TAnyFeature[]
]
	? [
			TInstallableFeature<GFeatureToInstall, GInstalledFeatures>,
			...TInstallableFeatures<[...GInstalledFeatures, GFeatureToInstall], GRest>
		]
	: [];

type TInstallableFeature<
	GFeatureToInstall extends TAnyFeature,
	GInstalledFeatures extends TAnyFeature[]
> =
	TMissingRequiredFeatureKeys<GInstalledFeatures, GFeatureToInstall['requires']> extends never
		? GFeatureToInstall
		: TMissingFeatureRequirementError<
				TMissingRequiredFeatureKeys<GInstalledFeatures, GFeatureToInstall['requires']>
			>;

interface TMissingFeatureRequirementError<GMissingFeatureKeys extends string> {
	error: 'Missing required features';
	missing: GMissingFeatureKeys;
}

type TMissingRequiredFeatureKeys<
	GInstalledFeatures extends TAnyFeature[],
	GRequiredKeys extends readonly string[]
> = Exclude<GRequiredKeys[number], GInstalledFeatures[number]['key']>;

/**
 * Definition object accepted by `defineFeature()`.
 *
 * When `GFeature` has required features, `requires` is mandatory and type-checked against
 * the declared requirements.
 */
export type TFeatureDefinition<GFeature extends TAnyFeature> =
	TRequiredFeaturesOf<GFeature> extends readonly []
		? {
				key: GFeature['key'];
				install(host: never): TFeatureApi<GFeature>;
			}
		: {
				key: GFeature['key'];
				requires: GFeature['requires'];
				install(
					host: TFeatureApiIntersection<TRequiredFeaturesOf<GFeature>>
				): TFeatureApi<GFeature>;
			};

type TFeatureApi<GFeature extends TAnyFeature> =
	GFeature extends TFeature<string, infer GApi, readonly TAnyFeature[]>
		? GApi
		: ReturnType<GFeature['install']>;

// Note: Positional tuple, not a union array to enforce that every required key is listed and
// mirrors the GRequiredFeatures generic. A union array would only validate allowed keys, not coverage.
type TRequiredFeatureKeyTuple<GFeatures extends readonly TAnyFeature[]> =
	GFeatures extends readonly [
		infer GFeature extends TAnyFeature,
		...infer GRest extends TAnyFeature[]
	]
		? readonly [GFeature['key'], ...TRequiredFeatureKeyTuple<GRest>]
		: readonly [];

type TRequiredFeaturesOf<GFeature extends TAnyFeature> =
	GFeature extends TFeature<string, object, infer GRequiredFeatures extends readonly TAnyFeature[]>
		? GRequiredFeatures
		: readonly [];

/**
 * Extracts the installed features tuple from a feature host type.
 */
export type TInstalledFeaturesOf<GHost> =
	GHost extends TFeatureHost<object, infer GFeatures> ? GFeatures : [];
