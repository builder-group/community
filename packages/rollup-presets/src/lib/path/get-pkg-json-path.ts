import path from 'node:path';
import { doesFileExist } from '../fs';

export function getPkgJsonPath(): string | null {
	const packageJsonPath = path.resolve(process.cwd(), 'package.json');
	if (!doesFileExist(packageJsonPath)) {
		return null;
	}
	return packageJsonPath;
}
