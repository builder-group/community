import { TEntityId } from '../../entity';
import { TPlugin } from '../types';

export function createDefaultPlugin(): TDefaultPlugin {
	return {
		name: 'Default',
		deps: []
	};
}

export type TDefaultPlugin = TPlugin<
	{
		name: 'Default';
		components: {
			// Markers
			Removed: TCRemoved;

			// Mixins
			ParentMixin: TCParentMixin[];
			ChildrenMixin: TChildrenMixin[];
		};
		systemSets: 'First' | 'Update' | 'Last';
	},
	[]
>;

export type TCRemoved = {};

export interface TCParentMixin {
	parent: TEntityId;
}

export interface TChildrenMixin {
	children: TEntityId[];
}
