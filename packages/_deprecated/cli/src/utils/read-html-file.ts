import fs from 'node:fs/promises';

export async function readHtmlFile(filePath: string): Promise<string | null> {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		return content;
	} catch (error) {
		return null;
	}
}
