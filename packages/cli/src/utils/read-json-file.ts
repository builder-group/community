import fs from 'node:fs/promises';

export async function readJsonFile<T = unknown>(filePath: string): Promise<T | null> {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		return JSON.parse(content) as T;
	} catch (error) {
		return null;
	}
}
