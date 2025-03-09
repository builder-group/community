import { PackageJson } from 'type-fest';
import { readJsonFile } from './fs/read-json-file';
import { getPkgJsonPath } from './path';

export async function getPkgJson(): Promise<PackageJson | null> {
	const pkgJsonPath = getPkgJsonPath();
	if (pkgJsonPath == null) {
		return null;
	}

	const pkgJson = await readJsonFile<PackageJson>(pkgJsonPath);
	if (pkgJson == null) {
		return null;
	}

	return pkgJson;
}
