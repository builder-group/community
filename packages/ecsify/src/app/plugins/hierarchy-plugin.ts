import { TEntityId } from '../../entity';
import { TPlugin } from '../types';

export function createHierarchyPlugin(): THierarchyPlugin {
	return {
		name: 'Hierarchy',
		deps: [],
		components: {
			ParentMixin: [],
			ChildrenMixin: []
		}
	};
}

export type THierarchyPlugin = TPlugin<
	{
		name: 'Hierarchy';
		components: {
			// Mixins
			ParentMixin: TCParentMixin[];
			ChildrenMixin: TChildrenMixin[];
		};
		appExtensions: {
			pushChild(parent: TEntityId, child: TEntityId): void;
			removeChild(parent: TEntityId, child: TEntityId): void;
			hasChild(parent: TEntityId, child: TEntityId): boolean;
			getChildren(parent: TEntityId): TEntityId[];
			getParent(child: TEntityId): TEntityId;
		};
	},
	[]
>;

export interface TCParentMixin {
	parent: TEntityId;
}

export interface TChildrenMixin {
	children: TEntityId[];
}
