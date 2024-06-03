import type { RollupOptions, RollupWatcher } from 'rollup';

import type { DynCommand } from '../../DynCommand';
import { watchWithRollup, type TEventWatcher } from './watch';

export async function watchAllWithRollup(
	command: DynCommand,
	rollupOptions: RollupOptions[],
	eventWatcher?: TEventWatcher
): Promise<RollupWatcher[]> {
	return Promise.all(rollupOptions.map((option) => watchWithRollup(command, option, eventWatcher)));
}
