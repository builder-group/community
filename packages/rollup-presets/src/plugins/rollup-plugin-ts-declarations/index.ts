import path from 'path';
import pc from 'picocolors';
import type { Plugin } from 'rollup';
import * as ts from 'typescript';
import { getTsConfigCompilerOptions } from '../../lib';

export function tsDeclarationsPlugin(config: TTsDeclarationsPluginConfig): Plugin {
	const { outputPath, inputPath, tsConfigPath } = config;
	const compilerOptions = {
		...getTsConfigCompilerOptions(tsConfigPath, {
			declaration: true,
			emitDeclarationOnly: true,
			outDir: path.dirname(outputPath)
		}),
		...config.compilerOptions
	};

	return {
		name: 'ts-declarations',
		async generateBundle() {
			console.log(
				`Generating TypeScript declarations from ${pc.green(inputPath)} to ${pc.green(outputPath)}...`
			);

			const files = [inputPath];
			const program = ts.createProgram(files, compilerOptions);
			const createdFiles: Record<string, string> = {};

			const host = ts.createCompilerHost(compilerOptions);
			host.writeFile = (fileName, contents) => {
				createdFiles[fileName] = contents;
			};

			const emitResult = program.emit(undefined, host.writeFile);
			const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

			if (diagnostics.length > 0) {
				diagnostics.forEach((diagnostic) => {
					const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
					console.error(pc.red(`TypeScript Error: ${message}`));
				});
				process.exit(1);
			}

			for (const [filePath, content] of Object.entries(createdFiles)) {
				this.emitFile({
					type: 'asset',
					fileName: path.relative(process.cwd(), filePath),
					source: content
				});
			}
		}
	};
}

interface TTsDeclarationsPluginConfig {
	/**
	 * Path to the input TypeScript file
	 * @example './src/index.ts'
	 */
	inputPath: string;

	/**
	 * Path where declaration files will be output
	 * @example './dist/types/index.d.ts'
	 */
	outputPath: string;

	/**
	 * Path to tsconfig.json file
	 */
	tsConfigPath?: string;

	/**
	 * Compiler options that override tsconfig.json
	 */
	compilerOptions?: ts.CompilerOptions;
}
