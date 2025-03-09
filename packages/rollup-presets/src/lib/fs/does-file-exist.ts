import fs from 'node:fs';

export function doesFileExist(filePath: string): boolean {
	return fs.existsSync(filePath);
}
