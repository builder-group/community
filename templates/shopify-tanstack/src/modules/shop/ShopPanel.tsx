import React from 'react';

export const ShopPanel: React.FC<TShopPanelProps> = (props) => {
	const { shop } = props;

	return (
		<s-stack direction="block" gap="base">
			<s-text>{shop.name}</s-text>
			<s-text>{shop.domain}</s-text>
		</s-stack>
	);
};

interface TShopPanelProps {
	shop: {
		name: string;
		domain: string;
	};
}
