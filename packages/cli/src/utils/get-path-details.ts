import path from 'node:path';

export function getPathDetails(filePath: string): {
	directory: string;
	fileName: string;
	extension: string;
} {
	const directory = path.dirname(filePath);
	const baseName = path.basename(filePath);
	const extension = path.extname(filePath);
	const fileName = baseName.replace(extension, '');

	return { directory, fileName, extension };
}
