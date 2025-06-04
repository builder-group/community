import { TEntityId } from '../../entity';
import { TPlugin } from '../types';

export function createIdPlugin(): TIdPlugin {
	return {
		name: 'Id',
		deps: [],
		components: {
			IdMixin: []
		}
	};
}

export type TIdPlugin = TPlugin<
	{
		name: 'Id';
		components: {
			// Mixins
			IdMixin: TCIdMixin[];
		};
		appExtensions: {
			getEntityById(id: TCIdMixinId): TEntityId | null;
		};
	},
	[]
>;

export interface TCIdMixin {
	id: TCIdMixinId;
}
export type TCIdMixinId = string | number;
