import { Command } from '@oclif/core';

export abstract class DynCommand extends Command {
	public isVerbose = false;
	public isProduction = false;
}
