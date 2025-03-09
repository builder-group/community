import fs from 'node:fs/promises';
import dotenv from 'dotenv';

export async function readDotenvFile<T extends Record<string, string>>(
	filePath: string
): Promise<T | null> {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		const parsed = dotenv.parse(content);

		// Wrap values with quotes to handle strings containing special characters (required for replace plugin)
		const env: Record<string, string> = {};
		for (const key in parsed) {
			env[`process.env.${key}`] = JSON.stringify(parsed[key]);
		}

		return env as T;
	} catch (error) {
		return null;
	}
}
