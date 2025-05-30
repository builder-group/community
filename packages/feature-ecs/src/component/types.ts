import { TEntityId } from '../entity';

export interface TComponentData {
	/** Unique component ID */
	id: number;
	/** Generation ID (which mask array this component uses) */
	generationId: number;
	/** Bitflag for this component (power of 2) */
	bitflag: number;
	/** Reference to the component object */
	ref: TComponentRef;
}

export type TComponentRef = any; // Can be array or object with arrays

export interface TComponentCallbacks {
	onAdd?: ((eid: TEntityId) => void)[];
	onChange?: ((eid: TEntityId) => void)[];
	onRemove?: ((eid: TEntityId) => void)[];
	onFlush?: (() => void)[];
}
