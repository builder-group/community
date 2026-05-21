import type { TFlap } from '../types';

/** Returns the key used to address a flap inside a spool. */
export function getFlapKey(flap: TFlap): string {
	switch (flap.type) {
		case 'char':
		case 'color':
			return flap.key ?? flap.value;
		case 'image':
			return flap.key ?? flap.src;
		case 'custom':
			return flap.key;
	}
}
