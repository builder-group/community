import type { SAppNavAttributes, SAppWindowAttributes } from '@shopify/app-bridge-types';
import '@shopify/polaris-types';

declare module 'react' {
	namespace JSX {
		interface IntrinsicElements {
			's-app-nav': SAppNavAttributes;
			's-app-window': SAppWindowAttributes;
		}
	}
}
