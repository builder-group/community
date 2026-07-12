import React from 'react';
import { apiClient } from '@/environment';

type TShopState =
	| { status: 'loading' }
	| { status: 'error'; message: string }
	| { status: 'success'; name: string; domain: string };

export const ShopPanel: React.FC = () => {
	const [state, setState] = React.useState<TShopState>({ status: 'loading' });

	React.useEffect(() => {
		let active = true;

		void apiClient.get('/v1/shop').then(([isOk, error, data]) => {
			if (!active) {
				return;
			}

			if (!isOk) {
				setState({ status: 'error', message: error.message });
				return;
			}

			setState({
				status: 'success',
				name: data.shop.name,
				domain: data.shop.domain
			});
		});

		return () => {
			active = false;
		};
	}, []);

	if (state.status === 'loading') {
		return <s-text>Loading shop…</s-text>;
	}

	if (state.status === 'error') {
		return <s-banner tone="critical">{state.message}</s-banner>;
	}

	return (
		<s-stack direction="block" gap="base">
			<s-text>{state.name}</s-text>
			<s-text>{state.domain}</s-text>
		</s-stack>
	);
};
