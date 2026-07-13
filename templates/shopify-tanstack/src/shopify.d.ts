import type { SAppNavAttributes, SAppWindowAttributes } from '@shopify/app-bridge-types';
import '@shopify/polaris-types';

// Note: App Bridge augments global JSX, while React 19 resolves elements through React.JSX
declare module 'react' {
	namespace JSX {
		interface IntrinsicElements {
			's-app-nav': SAppNavAttributes;
			's-app-window': SAppWindowAttributes;
		}
	}
}
