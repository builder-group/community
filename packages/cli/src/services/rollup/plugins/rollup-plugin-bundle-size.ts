import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import type { Plugin } from 'rollup';

import type { DynCommand } from '../../../DynCommand';

async function bundleSize(command: DynCommand): Promise<Plugin> {
	const maxmin = (await import('maxmin')).default;
	return {
		name: 'rollup-plugin-bundle-size',
		generateBundle(options, bundle) {
			const filePath = options.file;

			if (filePath != null) {
				const fileName = path.basename(filePath);
				const file = bundle[fileName];

				if (file != null && 'code' in file) {
					const [originalSize, minifiedSize, compressedSize] = maxmin(
						file.code,
						file.code,
						true
					).split(' → ');

					command.log(
						`Created single file bundle for ${chalk.magenta(
							chalk.underline(options.name)
						)} (${chalk.blue(options.format)}):`
					);
					command.log(`  - Original Size: ${chalk.green(chalk.underline(`${originalSize}`))}`);
					command.log(`  - Minified Size: ${chalk.green(chalk.underline(`${minifiedSize}`))}`);
					command.log(`  - Gzipped Size: ${chalk.green(chalk.underline(`${compressedSize}`))}`);
				}
			}
		},
		writeBundle(options) {
			const dirPath = options.dir;

			if (dirPath != null) {
				const dirSize = getDirectorySize(dirPath);
				command.log(
					`Created directory for ${chalk.magenta(chalk.underline(options.name))} (${chalk.blue(
						options.format
					)}): ${chalk.green(chalk.underline(`${dirSize} bytes`))}`
				);
			}
		}
	};
}

function getDirectorySize(dirPath: string): number {
	let totalSize = 0;
	const files = fs.readdirSync(dirPath);

	files.forEach((file) => {
		const filePath = path.join(dirPath, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			totalSize += getDirectorySize(filePath);
		} else {
			totalSize += stat.size;
		}
	});

	return totalSize;
}

export default bundleSize;
