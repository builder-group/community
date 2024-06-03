import type { RollupOptions, RollupOutput } from 'rollup';

import type { DynCommand } from '../../DynCommand';
import { bundleWithRollup } from './bundle';

export async function bundleAllWithRollup(
	command: DynCommand,
	rollupOptions: RollupOptions[]
): Promise<RollupOutput[][]> {
	return Promise.all(rollupOptions.map((option) => bundleWithRollup(command, option)));
}
