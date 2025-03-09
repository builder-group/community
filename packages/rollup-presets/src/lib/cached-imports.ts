export const getExeca = createCachedImport<typeof import('execa')>('execa');

function createCachedImport<T>(moduleName: string): () => Promise<T> {
	let cachedModule: Promise<T>;

	return async function getModule(): Promise<T> {
		if (cachedModule == null) {
			cachedModule = import(moduleName) as Promise<T>;
		}
		return cachedModule;
	};
}
