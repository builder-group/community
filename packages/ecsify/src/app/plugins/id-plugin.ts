import { TPlugin } from '../types';

export function createIdPlugin(): TIdPlugin {
	return {
		name: 'Id',
		deps: []
	};
}

export type TIdPlugin = TPlugin<
	{
		name: 'Id';
		components: {
			// Mixins
			IdMixin: TCIdMixin[];
		};
	},
	[]
>;

export interface TCIdMixin {
	id: TCIdMixinId;
}
export type TCIdMixinId = string | number;
