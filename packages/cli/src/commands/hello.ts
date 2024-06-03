import chalk from 'chalk';

import { DynCommand } from '../DynCommand';
import { promisifyFiglet } from '../utils';

export default class Hello extends DynCommand {
	public async run(): Promise<void> {
		this.log(chalk.yellowBright(await promisifyFiglet('dyn-cli says hello')));
		this.log(`\n`);
	}
}
