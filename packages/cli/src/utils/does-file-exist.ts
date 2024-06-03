import fs from 'node:fs';

export function doesFileExist(path: string): boolean {
	return fs.existsSync(path);
}
