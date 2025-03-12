import path from 'path';
import pc from 'picocolors';
import type { Plugin } from 'rollup';
import * as ts from 'typescript';
import { getTsConfigCompilerOptions } from '../../lib';

export function tsDeclarationsPlugin(config: TTsDeclarationsPluginConfig): Plugin {
	const {
		tsConfigPath,
		compilerOptions: customCompilerOptions = {},
		extension = '.ts',
		diagnosticsLevel = 'warn',
		debug = false
	} = config;
	let inputPath: string;

	return {
		name: 'ts-declarations',

		options(options) {
			if (typeof options.input === 'string') {
				inputPath = options.input;
			} else {
				throw new Error(pc.red('[ts-declarations] Rollup input must be a string'));
			}
		},

		load(id) {
			if (id === inputPath) {
				return 'export {}';
			}
			return null;
		},

		async generateBundle(options, bundle) {
			const outDir = options.dir ?? path.dirname(options.file as string);
			const compilerOptions = {
				...getTsConfigCompilerOptions(tsConfigPath),
				...{
					declaration: true,
					emitDeclarationOnly: true,
					outDir,
					declarationDir: outDir
					// rootDir: path.dirname(inputPath)
				},
				...customCompilerOptions
			};

			if (debug) {
				console.log(
					pc.dim(`[ts-declarations] Compiler options: ${JSON.stringify(compilerOptions)}`)
				);
			}

			// Remove any JavasScript files from the bundle (e.g. entry point)
			for (const fileName in bundle) {
				if (fileName.endsWith('.js')) {
					delete bundle[fileName];
				}
			}

			const program = ts.createProgram([inputPath], compilerOptions);

			// Check for errors before emitting
			const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
			logDiagnostics(preEmitDiagnostics, diagnosticsLevel);

			// Emit declarations
			const emitResult = program.emit(
				undefined,
				(fileName, text) => {
					if (fileName.endsWith('.d.ts')) {
						const relativePath = path.relative(outDir, fileName);

						// Rollup requires chunk names to be neither absolute nor relative paths—normalize to a valid format.
						const normalizedPath = relativePath
							.split(path.sep)
							.filter((segment) => segment !== '..' && segment !== '.')
							.join('/');

						if (debug) {
							console.log(pc.dim(`[ts-declarations] Emitting ${normalizedPath}`));
						}

						this.emitFile({
							type: 'asset',
							fileName: normalizedPath.replace('.ts', extension),
							source: text
						});
					}
				},
				undefined,
				true // emitOnlyDtsFiles
			);

			// Check for emit errors
			logDiagnostics(emitResult.diagnostics, diagnosticsLevel);
		}
	};
}

function logDiagnostics(
	diagnostics: readonly ts.Diagnostic[],
	diagnosticsLevel: 'error' | 'warn' | 'ignore'
) {
	if (diagnosticsLevel === 'ignore' || diagnostics.length === 0) {
		return;
	}

	const formatHost: ts.FormatDiagnosticsHost = {
		getCanonicalFileName: (path) => path,
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		getNewLine: () => ts.sys.newLine
	};

	const message = ts.formatDiagnostics(diagnostics, formatHost);

	if (diagnosticsLevel === 'warn') {
		console.warn(pc.yellow('[ts-declarations] TypeScript warnings:'));
		console.warn(pc.yellow(message));
		return;
	}

	throw new Error(pc.red('[ts-declarations] TypeScript errors:\n' + message));
}

export interface TTsDeclarationsPluginConfig {
	/**
	 * Path to tsconfig.json file
	 */
	tsConfigPath?: string;

	/**
	 * Compiler options that override tsconfig.json
	 */
	compilerOptions?: ts.CompilerOptions;

	/**
	 * How to handle TypeScript diagnostics
	 * - 'error': Throw error and stop build (default)
	 * - 'warn': Log warning in yellow and continue
	 * - 'ignore': Silent mode
	 */
	diagnosticsLevel?: 'error' | 'warn' | 'ignore';

	/**
	 * File extension to emit
	 * @default '.ts'
	 */
	extension?: '.ts' | '.cts' | '.mts' | `.${string}`;

	/**
	 * Whether to log debug information
	 * @default false
	 */
	debug?: boolean;
}
