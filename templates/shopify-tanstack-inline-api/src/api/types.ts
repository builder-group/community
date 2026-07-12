import type { Session } from '@shopify/shopify-api';
import type { getShopify } from './integrations/shopify';

export interface TApiEnv {
	Variables: {
		shopify: {
			admin: InstanceType<ReturnType<typeof getShopify>['clients']['Graphql']>;
			session: Session;
			shop: string;
		};
	};
}
