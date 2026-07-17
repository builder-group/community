import React from 'react';

export const ShopPanel: React.FC<TShopPanelProps> = (props) => {
	const { shop } = props;

	return (
		<div className="flex flex-col gap-2">
			<s-text>{shop.name}</s-text>
			<s-text>{shop.domain}</s-text>
		</div>
	);
};

interface TShopPanelProps {
	shop: {
		name: string;
		domain: string;
	};
}
