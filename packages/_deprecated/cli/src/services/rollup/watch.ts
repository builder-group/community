import chalk from 'chalk';
import { watch, type RollupOptions, type RollupWatcher, type RollupWatcherEvent } from 'rollup';
import type { DynCommand } from '../../DynCommand';
import { pluginsToKeys } from './plugins-to-keys';

export function watchWithRollup(
	command: DynCommand,
	rollupOptions: RollupOptions,
	eventWatcher?: TEventWatcher
): RollupWatcher {
	command.log(
		'🚀 Starting watch mode.',
		command.isVerbose
			? chalk.gray(
					JSON.stringify({
						args: [
							{
								options: {
									...rollupOptions,
									plugins: pluginsToKeys(rollupOptions.plugins)
								}
							}
						]
					})
				)
			: ''
	);

	// https://rollupjs.org/javascript-api/#rollup-watch
	const watcher = watch(rollupOptions);

	// Register main watcher callback
	watcher.on('event', async (event) => {
		if (eventWatcher != null) {
			await eventWatcher({ event, rollupOptions });
		}

		switch (event.code) {
			case 'START':
				command.log('👀 Watching for changes...');
				break;
			case 'BUNDLE_START':
				command.log('🚀 Started bundling.');
				break;
			case 'BUNDLE_END':
				command.log('🏁 Completed bundling.');
				break;
			case 'END':
				command.log('🔄 Rebuilt files.');
				break;
			case 'ERROR':
				command.log('⚠️ Error during build:', event.error);
				break;
		}
	});

	// Register last watcher callback
	// which makes sure that bundles are properly closed after each run
	watcher.on('event', (event: any) => {
		if ('result' in event) {
			event?.result?.close();
		}
	});

	return watcher;
}

export type TEventWatcher = (props: {
	event: RollupWatcherEvent;
	rollupOptions: RollupOptions;
}) => Promise<void>;
