import type { TFlap } from '../types';

export function getFlapKey(flap: TFlap): string {
	if (flap.key != null) return flap.key;
	switch (flap.type) {
		case 'char':
		case 'color':
			return flap.value;
		case 'image':
			return flap.src;
		case 'custom':
			return flap.key;
	}
}
