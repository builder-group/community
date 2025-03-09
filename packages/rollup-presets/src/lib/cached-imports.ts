/**
 * Allows using ESM-only modules in a CommonJS context via dynamic imports.
 *
 * https://github.com/sindresorhus/execa/issues/489
 * https://stackoverflow.com/questions/65265420/how-to-prevent-typescript-from-transpiling-dynamic-imports-into-require
 */

export const getExeca = createCachedImport<typeof import('execa')>('execa');

function createCachedImport<T>(moduleName: string): () => Promise<T> {
	let cachedModule: Promise<T>;

	return async function getModule(): Promise<T> {
		// @ts-expect-error -- eval is used to avoid transpiling dynamic imports
		if (cachedModule == null) {
			eval(`cachedModule = import('${moduleName}')`);
		}
		// @ts-expect-error -- eval is used to avoid transpiling dynamic imports
		return cachedModule;
	};
}
