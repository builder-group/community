import path from 'node:path';
import html from '@rollup/plugin-html';
import postcss from 'rollup-plugin-postcss';
import type { PackageJson } from 'type-fest';
import { readHtmlFile } from '../../../../utils';
import type { TBaseDynRollupOptions, TDynRollupOptionsCallbackConfig } from '../../../dyn';

export async function createAppRollupConfig(
	config: TDynRollupOptionsCallbackConfig & { postcssConfigPath: string; htmlTemplatePath?: string }
): Promise<TBaseDynRollupOptions> {
	const { paths, output, packageJson, isProduction, postcssConfigPath, htmlTemplatePath } = config;
	const bundleName = path.basename(paths.output).replace('.js', '');
	const htmlTemplate = await loadHtmlTemplate(htmlTemplatePath);

	return {
		input: paths.input,
		output,
		plugins: [
			'node-resolve',
			'commonjs',
			'resolve-typescript-paths',
			'esbuild',
			// Process and bundle CSS files
			postcss({
				config: {
					path: postcssConfigPath,
					ctx: {}
				},
				minimize: isProduction,
				sourceMap: !isProduction
			}),
			'replace',
			// Inject the bundle into HTML template
			html({
				fileName: `${bundleName}.html`,
				template: (htmlTemplateOptions) => {
					const appBundle = htmlTemplateOptions?.bundle[`${bundleName}.js`];
					return embedBundleIntoHtml(
						appBundle != null && 'code' in appBundle
							? appBundle.code
							: '/* Failed to include app bundle! */',
						htmlTemplate,
						packageJson
					);
				}
			}),
			'rollup-plugin-license',
			'rollup-plugin-bundle-size'
		],
		external: []
	};
}

// Loads custom HTML template if provided
async function loadHtmlTemplate(htmlTemplatePath?: string): Promise<string | null> {
	if (htmlTemplatePath) {
		const absoluteRootHtmlPath = path.resolve(process.cwd(), htmlTemplatePath);
		return readHtmlFile(absoluteRootHtmlPath);
	}
	return null;
}

function embedBundleIntoHtml(
	bundle: string,
	htmlTemplate: string | null,
	packageJson: PackageJson
): string {
	return htmlTemplate != null
		? // TODO: `replace()` is not reliable here and damages the bundle so that it has syntax errors lol
			// Took me way too long to figure out and idk how to fix it yet
			htmlTemplate.replace('/*bundle*/', bundle)
		: `
        <!doctype html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <title>${packageJson.name ?? 'Figma Plugin'}</title>
            </head>
            <body>
                <script>
				    var exports = {}; // https://stackoverflow.com/questions/43042889/typescript-referenceerror-exports-is-not-defined
				    ${bundle}
				</script>
                <div id="root"></div>
            </body>
        </html>
    `;
}
