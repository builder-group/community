import type { TEnv, TEnvData, TEnvSpecs } from './types';
import { validateEnv } from './validate-env';

/** Validates grouped server, client, and shared env specs with a client-side server access guard. */
export function createEnv<
	GServerSpecs extends Record<string, unknown> = TEmptyEnvSpecs,
	GClientSpecs extends Record<string, unknown> = TEmptyEnvSpecs,
	GSharedSpecs extends Record<string, unknown> = TEmptyEnvSpecs
>(
	options: TCreateEnvOptions<GServerSpecs, GClientSpecs, GSharedSpecs>
): TCreateEnvData<GServerSpecs, GClientSpecs, GSharedSpecs> {
	const {
		env,
		server: serverSpecs = {},
		client: clientSpecs = {},
		shared: sharedSpecs = {},
		isServer = isServerRuntime(),
		onInvalidAccess = throwInvalidServerAccess
	} = options;

	assertUniqueSpecKeys([
		{ name: 'server', specs: serverSpecs },
		{ name: 'client', specs: clientSpecs },
		{ name: 'shared', specs: sharedSpecs }
	]);

	const activeSpecs = isServer
		? {
				...sharedSpecs,
				...serverSpecs,
				...clientSpecs
			}
		: {
				...sharedSpecs,
				...clientSpecs
			};
	const envData = validateEnv(env, activeSpecs);

	if (isServer) {
		return envData as TCreateEnvData<GServerSpecs, GClientSpecs, GSharedSpecs>;
	}

	const serverSpecKeys = new Set(Object.keys(serverSpecs));
	return new Proxy(envData, {
		get(target, propertyKey, receiver) {
			if (typeof propertyKey !== 'string') {
				return Reflect.get(target, propertyKey, receiver);
			}

			const shouldIgnoreProxyKey = propertyKey === '__esModule' || propertyKey === '$$typeof';
			if (shouldIgnoreProxyKey) {
				return undefined;
			}

			if (serverSpecKeys.has(propertyKey)) {
				return onInvalidAccess(propertyKey);
			}

			return Reflect.get(target, propertyKey, receiver);
		}
	}) as TCreateEnvData<GServerSpecs, GClientSpecs, GSharedSpecs>;
}

export interface TCreateEnvOptions<
	GServerSpecs extends Record<string, unknown> = TEmptyEnvSpecs,
	GClientSpecs extends Record<string, unknown> = TEmptyEnvSpecs,
	GSharedSpecs extends Record<string, unknown> = TEmptyEnvSpecs
> {
	/** Environment source, such as `process.env`, `import.meta.env`, or a test object. */
	env: TEnv;
	/** Server-only specs. Client access throws unless `onInvalidAccess` overrides it. */
	server?: TEnvSpecs<GServerSpecs>;
	/** Client-exposed specs validated on both server and client. */
	client?: TEnvSpecs<GClientSpecs>;
	/** Runtime-neutral specs shared by server and client code. */
	shared?: TEnvSpecs<GSharedSpecs>;
	/** Runtime side. Defaults to a global runtime check. */
	isServer?: boolean;
	/** Handles client-side reads of server-only keys. Must not return. */
	onInvalidAccess?: (key: string) => never;
}

export type TCreateEnvData<
	GServerSpecs extends Record<string, unknown> = TEmptyEnvSpecs,
	GClientSpecs extends Record<string, unknown> = TEmptyEnvSpecs,
	GSharedSpecs extends Record<string, unknown> = TEmptyEnvSpecs
> = Readonly<TSimplify<TEnvData<GSharedSpecs> & TEnvData<GServerSpecs> & TEnvData<GClientSpecs>>>;

type TEmptyEnvSpecs = Record<never, never>;

type TSimplify<GValue> = {
	[Key in keyof GValue]: GValue[Key];
};

function isServerRuntime(): boolean {
	return !('window' in globalThis) || 'Deno' in globalThis;
}

function throwInvalidServerAccess(key: string): never {
	throw new Error(`Attempted to access server-only env key ${key} on the client.`);
}

function assertUniqueSpecKeys(groups: TEnvSpecGroup[]): void {
	const seenKeys = new Map<string, string>();

	for (const group of groups) {
		for (const key of Object.keys(group.specs)) {
			const existingGroupName = seenKeys.get(key);
			if (existingGroupName != null) {
				throw new Error(
					`Env spec key ${key} is declared in both ${existingGroupName} and ${group.name} specs.`
				);
			}

			seenKeys.set(key, group.name);
		}
	}
}

interface TEnvSpecGroup {
	name: string;
	specs: Record<string, unknown>;
}
