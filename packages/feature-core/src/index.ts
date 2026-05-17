/**
 * Adds feature metadata and `.with()` to a plain object.
 *
 * Mutates and returns the provided object.
 */
export function createFeatureHost<GBase extends object>(base: GBase): TFeatureHost<GBase, []> {
	assertFeatureHostApiKeys(base);

	return Object.assign(base, {
		_features: [],
		with: withFeature
	}) as TFeatureHost<GBase, []>;
}

/**
 * Defines a composable feature that can be installed on a feature host.
 */
export function defineFeature<
	const GKey extends string,
	const GRequiredFeatureKeys extends readonly string[] = [],
	GInstall extends TFeatureInstall = TFeatureInstall
>(
	options: TDefineFeatureOptions<GKey, GRequiredFeatureKeys, GInstall>
): TFeature<GKey, GRequiredFeatureKeys, GInstall> {
	return {
		key: options.key,
		requires: options.requires ?? ([] as unknown as GRequiredFeatureKeys),
		install: options.install
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
	GFeatures extends TInstalledFeature[],
	GFeature extends TAnyFeature
>(
	host: TFeatureHost<GBase, GFeatures>,
	feature: GFeature &
		TFeatureRequirementConstraint<GFeature, GFeatures> &
		TFeatureInstallConstraint<GFeature, TFeatureHost<GBase, GFeatures>>
): TFeatureHost<GBase, TInstalledFeaturesAfter<GBase, GFeatures, GFeature>> {
	assertFeatureRequirements(host, feature);
	assertFeatureNotInstalled(host, feature);

	const api = feature.install(host as never);
	assertFeatureApiKeys(host, feature, api);
	Object.assign(host, api);
	(host._features as string[]).push(feature.key);

	return host as unknown as TFeatureHost<
		GBase,
		TInstalledFeaturesAfter<GBase, GFeatures, GFeature>
	>;
}

/**
 * Checks whether a value is a feature host with a specific installed feature.
 */
export function hasFeature<GFeature extends TInstalledFeature>(
	host: unknown,
	key: GFeature['key']
): host is TFeatureHost<object, [GFeature]>;
export function hasFeature<GKey extends string>(
	host: unknown,
	key: GKey
): host is TFeatureHost<object, [{ key: GKey; api: object }]>;
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
	this: TFeatureHost<object, TInstalledFeature[]>,
	...features: TAnyFeature[]
): TFeatureHost<object, TInstalledFeature[]> {
	for (const feature of features) {
		const installableFeature = feature as TAnyFeature &
			TFeatureInstallConstraint<TAnyFeature, typeof this>;
		installFeature(this, installableFeature);
	}

	return this;
}

function assertFeatureRequirements(
	host: TFeatureHost<object, TInstalledFeature[]>,
	feature: TAnyFeature
): void {
	const missingFeature = feature.requires.find((key) => !host._features.includes(key));
	if (missingFeature != null) {
		throw new Error(`Feature "${feature.key}" requires missing feature "${missingFeature}"`);
	}
}

function assertFeatureNotInstalled(
	host: TFeatureHost<object, TInstalledFeature[]>,
	feature: TAnyFeature
): void {
	if (host._features.includes(feature.key)) {
		throw new Error(`Feature "${feature.key}" is already installed`);
	}
}

function assertFeatureApiKeys(
	host: TFeatureHost<object, TInstalledFeature[]>,
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

function assertFeatureHostApiKeys(base: object): void {
	for (const key of featureHostApiKeys) {
		if (key in base) {
			throw new Error(`Feature host cannot overwrite existing property "${key}"`);
		}
	}
}

const featureHostApiKeys = ['_features', 'with'] as const;

export interface TDefineFeatureOptions<
	GKey extends string,
	GRequiredFeatureKeys extends readonly string[],
	GInstall extends TFeatureInstall
> {
	/**
	 * Unique feature key used for runtime dependency checks.
	 */
	key: GKey;
	/**
	 * Feature keys that must already be installed before this feature can be installed.
	 */
	requires?: GRequiredFeatureKeys;
	/**
	 * Adds behavior to the host and returns the public API exposed by this feature.
	 */
	install: GInstall;
}

/**
 * Runtime feature object created by `defineFeature()`.
 */
export interface TFeature<
	GKey extends string = string,
	GRequiredFeatureKeys extends readonly string[] = readonly string[],
	GInstall extends TFeatureInstall = TFeatureInstall,
	GInstalledFeature extends TInstalledFeature<GKey, object> = never
> {
	key: GKey;
	requires: GRequiredFeatureKeys;
	install: GInstall;
	/**
	 * @internal Type-only link to the installed feature contract.
	 */
	readonly __installedFeature?: GInstalledFeature;
}

/**
 * Feature contract after a runtime feature has been installed on a host.
 */
export interface TInstalledFeature<GKey extends string = string, GApi extends object = object> {
	key: GKey;
	api: GApi;
}

export type TFeatureHost<GBase extends object, GFeatures extends TInstalledFeature[]> = Omit<
	GBase,
	keyof TFeatureHostApi<object, TInstalledFeature[]>
> &
	TFeatureApis<GFeatures> &
	TFeatureHostApi<GBase, GFeatures>;

export interface TFeatureHostApi<GBase extends object, GFeatures extends TInstalledFeature[]> {
	/**
	 * @internal Feature metadata used by feature-core. Prefer `hasFeature()` for app code.
	 */
	readonly _features: readonly TFeatureKeys<GFeatures>[];
	/**
	 * Installs features on this host.
	 */
	with: TWithFeatureMethod<GBase, GFeatures>;
}

export interface TWithFeatureMethod<GBase extends object, GFeatures extends TInstalledFeature[]> {
	<const GFeaturesToInstall extends TAnyFeature[]>(
		...features: GFeaturesToInstall & TInstallableFeatures<GBase, GFeatures, GFeaturesToInstall>
	): TFeatureHost<GBase, TInstalledFeaturesAfterAll<GBase, GFeatures, GFeaturesToInstall>>;
}

export type TAnyFeature = TFeature<
	string,
	readonly string[],
	TFeatureInstall,
	TInstalledFeature<string, object>
>;

/**
 * Runtime feature object with an explicit installed feature contract.
 */
export type TDeclaredFeature<
	GInstalledFeature extends TInstalledFeature,
	GRequiredInstalledFeatures extends readonly TInstalledFeature[] = [],
	GInstall extends TFeatureInstall<GInstalledFeature['api']> = TFeatureInstall<
		GInstalledFeature['api']
	>
> = TFeature<
	GInstalledFeature['key'],
	TFeatureKeyTuple<GRequiredInstalledFeatures>,
	GInstall,
	GInstalledFeature
>;

/**
 * Generic feature install function. The `never` host keeps unconstrained feature installs
 * assignable while concrete features can still narrow the host parameter.
 */
export type TFeatureInstall<GApi extends object = object> = (host: never) => GApi;

export type TInstalledFeaturesAfter<
	GBase extends object,
	GFeatures extends TInstalledFeature[],
	GFeature extends TAnyFeature
> = [...GFeatures, TInstalledFeatureFrom<GFeature, TFeatureHost<GBase, GFeatures>>];

export type TInstalledFeaturesAfterAll<
	GBase extends object,
	GFeatures extends TInstalledFeature[],
	GFeaturesToInstall extends TAnyFeature[]
> = GFeaturesToInstall extends [
	infer GFeature extends TAnyFeature,
	...infer GRestFeatures extends TAnyFeature[]
]
	? TInstalledFeaturesAfterAll<
			GBase,
			TInstalledFeaturesAfter<GBase, GFeatures, GFeature>,
			GRestFeatures
		>
	: GFeatures;

export type TInstallableFeatures<
	GBase extends object,
	GFeatures extends TInstalledFeature[],
	GFeaturesToInstall extends TAnyFeature[]
> = GFeaturesToInstall extends [
	infer GFeature extends TAnyFeature,
	...infer GRestFeatures extends TAnyFeature[]
]
	? [
			TInstallableFeature<GFeature, TFeatureHost<GBase, GFeatures>>,
			...TInstallableFeatures<
				GBase,
				TInstalledFeaturesAfter<GBase, GFeatures, GFeature>,
				GRestFeatures
			>
		]
	: [];

export type TInstalledFeatureFrom<
	GFeature extends TAnyFeature,
	GHost extends TFeatureHost<object, TInstalledFeature[]>
> =
	TDeclaredInstalledFeatureOf<GFeature> extends TInstalledFeature
		? TDeclaredInstalledFeatureOf<GFeature>
		: TInstalledFeature<GFeature['key'], TFeatureApiOf<GFeature, GHost>>;

export type TDeclaredInstalledFeatureOf<GFeature extends TAnyFeature> =
	GFeature extends TFeature<string, readonly string[], TFeatureInstall, infer GInstalledFeature>
		? [GInstalledFeature] extends [never]
			? undefined
			: GInstalledFeature
		: undefined;

export type TFeatureApiOf<
	GFeature extends TAnyFeature,
	GHost extends TFeatureHost<object, TInstalledFeature[]>
> = GFeature extends { install: (host: GHost) => infer GApi }
	? GApi extends object
		? GApi
		: object
	: object;

export type TInstallableFeature<
	GFeature extends TAnyFeature,
	GHost extends TFeatureHost<object, TInstalledFeature[]>
> = TFeatureRequirementConstraint<GFeature, TInstalledFeaturesOf<GHost>> &
	TFeatureInstallConstraint<GFeature, GHost>;

export type TFeatureRequirementConstraint<
	GFeature extends TAnyFeature,
	GFeatures extends TInstalledFeature[]
> =
	TMissingFeatureKeys<GFeatures, GFeature['requires']> extends never
		? GFeature
		: TMissingFeatureError<TMissingFeatureKeys<GFeatures, GFeature['requires']>>;

export type TFeatureInstallConstraint<
	GFeature extends TAnyFeature,
	GHost extends TFeatureHost<object, TInstalledFeature[]>
> = GFeature extends { install: (host: infer GInstallHost) => object }
	? [GInstallHost] extends [never]
		? GFeature
		: GHost extends GInstallHost
			? GFeature
			: TIncompatibleFeatureHostError
	: GFeature;

export interface TMissingFeatureError<GMissingFeatures extends string> {
	error: 'Missing required features';
	missing: GMissingFeatures;
}

export interface TIncompatibleFeatureHostError {
	error: 'Feature install host is incompatible';
}

export type TInstalledFeaturesOf<GHost> =
	GHost extends TFeatureHostApi<object, infer GFeatures> ? GFeatures : [];

export type TFeatureKeys<GFeatures extends TInstalledFeature[]> = GFeatures[number]['key'];

export type TFeatureKeyTuple<GFeatures extends readonly TInstalledFeature[]> = Readonly<{
	[GIndex in keyof GFeatures]: GFeatures[GIndex] extends TInstalledFeature<infer GKey>
		? GKey
		: never;
}>;

export type TMissingFeatureKeys<
	GFeatures extends TInstalledFeature[],
	GRequiredFeatureKeys extends readonly string[]
> = Exclude<GRequiredFeatureKeys[number], TFeatureKeys<GFeatures>>;

export type TFeatureApis<GFeatures extends TInstalledFeature[]> = TIntersectAll<{
	[GIndex in keyof GFeatures]: GFeatures[GIndex] extends TInstalledFeature<string, infer GApi>
		? GApi
		: object;
}>;

export type TIntersectAll<GValues> = GValues extends readonly [infer GFirst, ...infer GRest]
	? GFirst & TIntersectAll<GRest>
	: object;
