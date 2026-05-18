/**
 * Adds feature metadata and `.with()` to a plain object.
 *
 * Mutates and returns the provided object.
 */
export function createFeatureHost<GBase extends object>(base: GBase): TFeatureHost<GBase, []> {
	// Reserved host properties must not already exist on base
	for (const key of reservedFeatureHostKeys) {
		if (key in base) {
			throw new Error(`Feature host cannot overwrite existing property "${key}"`);
		}
	}

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
	// Required features must already be installed
	const missingFeatureKey = feature.requires.find((key) => !host._features.includes(key));
	if (missingFeatureKey != null) {
		throw new Error(`Feature "${feature.key}" requires missing feature "${missingFeatureKey}"`);
	}

	// Feature must not be installed twice
	if (host._features.includes(feature.key)) {
		throw new Error(`Feature "${feature.key}" is already installed`);
	}

	const api = feature.install(host as never);

	// API keys must not collide with existing host properties before we mutate
	for (const key of Reflect.ownKeys(api)) {
		if (key in host) {
			throw new Error(
				`Feature "${feature.key}" cannot overwrite existing property "${String(key)}"`
			);
		}
	}

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
		// Note: TWithFeatureMethod enforces type safety on the public signature; the casts here are safe because installFeature validates at runtime
		installFeature(this as TFeatureHost<object, []>, feature as TFeature<string, object>);
	}

	return this;
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

// Note: Positional tuple rather than a union array so requires must list every key in order.
// A union array would accept partial lists, e.g. ['foo'] when ['foo', 'bar'] is required.
type TRequiredFeatureKeyTuple<GFeatures extends readonly TAnyFeature[]> =
	GFeatures extends readonly [
		infer GFeature extends TAnyFeature,
		...infer GRest extends TAnyFeature[]
	]
		? readonly [GFeature['key'], ...TRequiredFeatureKeyTuple<GRest>]
		: readonly [];

/**
 * Structural feature type for generic implementation code.
 */
// Note: A plain interface rather than `TFeature<string, object, TAnyFeature[]>` to avoid a
// self-referential type definition.
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

// Note: Cannot simplify to ReturnType<GFeature['install']> because through the TAnyFeature constraint,
// install is typed as (host: never) => object, so ReturnType degrades to object
// and the return type check in TFeatureDefinition stops catching wrong implementations.
type TFeatureApi<GFeature extends TAnyFeature> =
	GFeature extends TFeature<string, infer GApi, readonly TAnyFeature[]>
		? GApi
		: ReturnType<GFeature['install']>;

interface TFeatureHostApi<GBase extends object, GInstalledFeatures extends TAnyFeature[]> {
	/** @internal Prefer `hasFeature()` to check installed features. */
	readonly _features: readonly GInstalledFeatures[number]['key'][];
	with: TWithFeatureMethod<GBase, GInstalledFeatures>;
}

interface TWithFeatureMethod<GBase extends object, GInstalledFeatures extends TAnyFeature[]> {
	<const GFeaturesToInstall extends TAnyFeature[]>(
		...features: GFeaturesToInstall &
			TInstallableFeatureTuple<GInstalledFeatures, GFeaturesToInstall>
	): TFeatureHost<GBase, [...GInstalledFeatures, ...GFeaturesToInstall]>;
}

// Note: GInstalledFeatures grows with each recursive step so a feature can declare dependencies
// on features earlier in the same .with() call, not only on already-installed ones.
type TInstallableFeatureTuple<
	GInstalledFeatures extends TAnyFeature[],
	GFeaturesToInstall extends TAnyFeature[]
> = GFeaturesToInstall extends [
	infer GFeatureToInstall extends TAnyFeature,
	...infer GRest extends TAnyFeature[]
]
	? [
			TInstallableFeature<GFeatureToInstall, GInstalledFeatures>,
			...TInstallableFeatureTuple<[...GInstalledFeatures, GFeatureToInstall], GRest>
		]
	: [];

type TInstallableFeature<
	GFeatureToInstall extends TAnyFeature,
	GInstalledFeatures extends TAnyFeature[]
> =
	TDuplicateFeatureKey<GInstalledFeatures, GFeatureToInstall> extends never
		? TMissingRequiredFeatureKeys<GInstalledFeatures, GFeatureToInstall['requires']> extends never
			? GFeatureToInstall
			: TMissingFeatureRequirementError<
					TMissingRequiredFeatureKeys<GInstalledFeatures, GFeatureToInstall['requires']>
				>
		: TDuplicateFeatureError<TDuplicateFeatureKey<GInstalledFeatures, GFeatureToInstall>>;

// Note: When installed keys widen to string (e.g. TFeatureHost<object, TAnyFeature[]>),
// literal comparison is meaningless; return never to skip duplicate detection for broad hosts.
type TDuplicateFeatureKey<
	GInstalledFeatures extends TAnyFeature[],
	GFeatureToInstall extends TAnyFeature
> = string extends GInstalledFeatures[number]['key']
	? never
	: Extract<GFeatureToInstall['key'], GInstalledFeatures[number]['key']>;

interface TDuplicateFeatureError<GDuplicateFeatureKey extends string> {
	error: 'Feature already installed';
	duplicate: GDuplicateFeatureKey;
}

type TMissingRequiredFeatureKeys<
	GInstalledFeatures extends TAnyFeature[],
	GRequiredKeys extends readonly string[]
> = Exclude<GRequiredKeys[number], GInstalledFeatures[number]['key']>;

interface TMissingFeatureRequirementError<GMissingFeatureKeys extends string> {
	error: 'Missing required features';
	missing: GMissingFeatureKeys;
}

/**
 * Definition object accepted by `defineFeature()`.
 *
 * When `GFeature` has required features, `requires` is mandatory and type-checked against
 * the declared requirements.
 */
// Note: Install uses method syntax (not property syntax) for bivariant parameter checking,
// so feature authors can annotate a wider host type than the required-feature intersection.
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

type TRequiredFeaturesOf<GFeature extends TAnyFeature> =
	GFeature extends TFeature<string, object, infer GRequiredFeatures extends readonly TAnyFeature[]>
		? GRequiredFeatures
		: readonly [];

/**
 * Extracts the installed features tuple from a feature host type.
 */
export type TInstalledFeaturesOf<GHost> =
	GHost extends TFeatureHost<object, infer GFeatures> ? GFeatures : [];
