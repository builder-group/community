import { pathToFileURL } from 'node:url';

async function importFreshModule<T = unknown>(
	filePath: string,
	exportName?: string
): Promise<T | null> {
	const cacheBustingModulePath = pathToFileURL(filePath).toString();
	const module: unknown = await import(cacheBustingModulePath);

	if (typeof module !== 'object' || module == null) {
		return null;
	} else if (exportName != null && exportName in module) {
		return (module as Record<string, unknown>)[exportName] as T;
	} else if ('default' in module) {
		return module.default as T;
	}

	return null;
}

export async function readJsFile<T = unknown>(
	filePath: string,
	exportName?: string
): Promise<T | null> {
	try {
		return await importFreshModule<T>(filePath, exportName);
	} catch (error) {
		return null;
	}
}
