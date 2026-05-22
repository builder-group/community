import type { TEnv, TEnvData, TEnvSpecs } from './types';
import { validateEnv } from './validate-env';

/** Validates env values and returns a Vite `define` object for `import.meta.env.*`. */
export function createViteEnvDefine<GSpecs extends Record<string, unknown>>(
	env: TEnv,
	specs: TEnvSpecs<GSpecs>
): TViteEnvDefine<TEnvData<GSpecs>> {
	const values = validateEnv<GSpecs>(env, specs);
	const define: Record<string, string> = {};

	for (const [key, value] of Object.entries(values)) {
		define[`import.meta.env.${key}`] = stringifyViteDefineValue(key, value);
	}

	return define as TViteEnvDefine<TEnvData<GSpecs>>;
}

export type TViteEnvDefine<GEnvData extends Record<string, unknown> = Record<string, unknown>> = {
	[Key in keyof GEnvData & string as `import.meta.env.${Key}`]: string;
};

function stringifyViteDefineValue(key: string, value: unknown): string {
	if (value === undefined) {
		return 'undefined';
	}

	try {
		const stringifiedValue = JSON.stringify(value);
		if (stringifiedValue != null) {
			return stringifiedValue;
		}
	} catch {
		// Fall through to the shared error below
	}

	throw new Error(`Cannot serialize ${key} for Vite define.`);
}
