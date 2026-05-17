/**
 * Adds feature composition metadata and `.with()` to a plain object.
 */
export function createFeatureHost<GBase extends object>(base: GBase): TFeatureHost<GBase, []> {
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
	const GRequiredFeatures extends readonly string[] = [],
	GInstall extends TFeatureInstall = TFeatureInstall
>(
	definition: TDefineFeatureOptions<GKey, GRequiredFeatures, GInstall>
): TFeature<GKey, GRequiredFeatures, GInstall> {
	return {
		key: definition.key,
		requires: definition.requires ?? ([] as unknown as GRequiredFeatures),
		install: definition.install
	};
}

/**
 * Installs one feature on a host and returns the host typed with the feature API.
 */
export function installFeature<
	GHost extends TFeatureHost<object, TFeatureDefinition[]>,
	GFeature extends TAnyFeature
>(
	host: GHost,
	feature: GFeature &
		TFeatureRequirementConstraint<GFeature, TFeatureDefinitionsOf<GHost>> &
		TFeatureInstallConstraint<GFeature, GHost>
): TApplyFeature<GHost, GFeature> {
	assertFeatureRequirements(host, feature);

	if (host._features.includes(feature.key)) {
		throw new Error(`Feature "${feature.key}" is already installed`);
	}

	const api = feature.install(host as never);
	assertFeatureApiKeys(host, feature, api);
	Object.assign(host, api);
	(host._features as string[]).push(feature.key);

	return host as unknown as TApplyFeature<GHost, GFeature>;
}

/**
 * Checks whether a value is a feature host with a specific installed feature.
 */
export function hasFeature<GFeature extends TFeatureDefinition>(
	host: unknown,
	key: GFeature['key']
): host is TFeatureHost<object, [GFeature]>;
export function hasFeature<GKey extends string>(
	host: unknown,
	key: GKey
): host is TFeatureHost<object, [{ key: GKey; api: object }]>;
export function hasFeature(host: unknown, key: string): boolean {
	return (
		typeof host === 'object' &&
		host != null &&
		'_features' in host &&
		Array.isArray(host._features) &&
		host._features.includes(key)
	);
}

function withFeature(
	this: TFeatureHost<object, TFeatureDefinition[]>,
	...features: TAnyFeature[]
): TFeatureHost<object, TFeatureDefinition[]> {
	for (const feature of features) {
		const installableFeature = feature as TAnyFeature &
			TFeatureInstallConstraint<TAnyFeature, typeof this>;
		installFeature(this, installableFeature);
	}

	return this;
}

function assertFeatureRequirements(
	host: TFeatureHost<object, TFeatureDefinition[]>,
	feature: TAnyFeature
): void {
	const missingFeature = feature.requires.find((key) => !host._features.includes(key));
	if (missingFeature != null) {
		throw new Error(`Feature "${feature.key}" requires missing feature "${missingFeature}"`);
	}
}

function assertFeatureApiKeys(
	host: TFeatureHost<object, TFeatureDefinition[]>,
	feature: TAnyFeature,
	api: object
): void {
	for (const key of Object.keys(api)) {
		if (key in host) {
			throw new Error(`Feature "${feature.key}" cannot overwrite existing property "${key}"`);
		}
	}
}

export interface TDefineFeatureOptions<
	GKey extends string,
	GRequiredFeatures extends readonly string[],
	GInstall extends TFeatureInstall
> {
	key: GKey;
	requires?: GRequiredFeatures;
	install: GInstall;
}

export interface TFeature<
	GKey extends string = string,
	GRequiredFeatures extends readonly string[] = readonly string[],
	GInstall extends TFeatureInstall = TFeatureInstall
> {
	key: GKey;
	requires: GRequiredFeatures;
	install: GInstall;
}

export interface TFeatureDefinition<GKey extends string = string, GApi extends object = object> {
	key: GKey;
	api: GApi;
}

export type TFeatureHost<GBase extends object, GFeatures extends TFeatureDefinition[]> = Omit<
	GBase,
	keyof TFeatureHostApi<object, TFeatureDefinition[]>
> &
	TFeatureApis<GFeatures> &
	TFeatureHostApi<GBase, GFeatures>;

export interface TFeatureHostApi<GBase extends object, GFeatures extends TFeatureDefinition[]> {
	/**
	 * @internal Feature metadata used by feature-core. Prefer `hasFeature()` for app code.
	 */
	readonly _features: readonly TFeatureKeys<GFeatures>[];
	with: TWithFeatureMethod<TFeatureHost<GBase, GFeatures>>;
}

export interface TWithFeatureMethod<GHost extends TFeatureHost<object, TFeatureDefinition[]>> {
	<GFeature extends TAnyFeature>(
		feature: TFeatureRequirementConstraint<GFeature, TFeatureDefinitionsOf<GHost>> &
			TFeatureInstallConstraint<GFeature, GHost>
	): TApplyFeature<GHost, GFeature>;
	<
		GFeature1 extends TAnyFeature,
		GHost1 extends TApplyFeature<GHost, GFeature1>,
		GFeature2 extends TAnyFeature
	>(
		feature1: TFeatureRequirementConstraint<GFeature1, TFeatureDefinitionsOf<GHost>> &
			TFeatureInstallConstraint<GFeature1, GHost>,
		feature2: TFeatureRequirementConstraint<GFeature2, TFeatureDefinitionsOf<GHost1>> &
			TFeatureInstallConstraint<GFeature2, GHost1>
	): TApplyFeature<GHost1, GFeature2>;
	<
		GFeature1 extends TAnyFeature,
		GHost1 extends TApplyFeature<GHost, GFeature1>,
		GFeature2 extends TAnyFeature,
		GHost2 extends TApplyFeature<GHost1, GFeature2>,
		GFeature3 extends TAnyFeature
	>(
		feature1: TFeatureRequirementConstraint<GFeature1, TFeatureDefinitionsOf<GHost>> &
			TFeatureInstallConstraint<GFeature1, GHost>,
		feature2: TFeatureRequirementConstraint<GFeature2, TFeatureDefinitionsOf<GHost1>> &
			TFeatureInstallConstraint<GFeature2, GHost1>,
		feature3: TFeatureRequirementConstraint<GFeature3, TFeatureDefinitionsOf<GHost2>> &
			TFeatureInstallConstraint<GFeature3, GHost2>
	): TApplyFeature<GHost2, GFeature3>;
}

export type TAnyFeature = TFeature<string, readonly string[], TFeatureInstall>;

export type TFeatureInstall = (host: never) => object;

export type TApplyFeature<
	GHost extends TFeatureHost<object, TFeatureDefinition[]>,
	GFeature extends TAnyFeature
> = TFeatureHost<
	TFeatureBaseOf<GHost>,
	[TFeatureDefinitionFrom<GFeature, GHost>, ...TFeatureDefinitionsOf<GHost>]
>;

export type TFeatureDefinitionFrom<
	GFeature extends TAnyFeature,
	GHost extends TFeatureHost<object, TFeatureDefinition[]>
> = TFeatureDefinition<TFeatureKeyOf<GFeature>, TFeatureApiOf<GFeature, GHost>>;

export type TFeatureApiOf<
	GFeature extends TAnyFeature,
	GHost extends TFeatureHost<object, TFeatureDefinition[]>
> = GFeature extends { install: (host: GHost) => infer GApi }
	? GApi extends object
		? GApi
		: object
	: object;

export type TFeatureKeyOf<GFeature extends TAnyFeature> = GFeature['key'];

export type TFeatureRequirementsOf<GFeature extends TAnyFeature> = GFeature['requires'];

export type TFeatureRequirementConstraint<
	GFeature extends TAnyFeature,
	GFeatures extends TFeatureDefinition[]
> =
	TMissingFeatureKeys<GFeatures, TFeatureRequirementsOf<GFeature>> extends never
		? GFeature
		: TMissingFeatureError<TMissingFeatureKeys<GFeatures, TFeatureRequirementsOf<GFeature>>>;

export type TFeatureInstallConstraint<
	GFeature extends TAnyFeature,
	GHost extends TFeatureHost<object, TFeatureDefinition[]>
> = GFeature extends { install: (host: infer GInstallHost) => object }
	? GHost extends GInstallHost
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

export type TFeatureDefinitionsOf<GHost> =
	GHost extends TFeatureHostApi<object, infer GFeatures> ? GFeatures : [];

export type TFeatureBaseOf<GHost> = Omit<
	GHost,
	keyof TFeatureHostApi<object, TFeatureDefinition[]>
>;

export type TFeatureKeys<GFeatures extends TFeatureDefinition[]> = GFeatures[number]['key'];

export type TMissingFeatureKeys<
	GFeatures extends TFeatureDefinition[],
	GRequiredFeatures extends readonly string[]
> = Exclude<GRequiredFeatures[number], TFeatureKeys<GFeatures>>;

export type TFeatureApis<GFeatures extends TFeatureDefinition[]> = TIntersectAll<{
	[GIndex in keyof GFeatures]: GFeatures[GIndex] extends TFeatureDefinition<string, infer GApi>
		? GApi
		: object;
}>;

export type TIntersectAll<GValues> = GValues extends readonly [infer GFirst, ...infer GRest]
	? GFirst & TIntersectAll<GRest>
	: object;
