import type { Product } from '@shopify/app-bridge-types';
import React from 'react';

export const ProductPicker: React.FC = () => {
	const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

	const handleSelectProduct = React.useCallback(async () => {
		const selectedProducts = await shopify.resourcePicker({
			type: 'product',
			action: 'select',
			multiple: false
		});
		if (selectedProducts == null) {
			return;
		}

		setSelectedProduct(selectedProducts[0] ?? null);
	}, []);

	return (
		<div className="flex flex-col items-start gap-2">
			<s-button onClick={handleSelectProduct}>
				{selectedProduct == null ? 'Select product' : 'Select another product'}
			</s-button>
			{selectedProduct != null ? <s-text>{selectedProduct.title}</s-text> : null}
		</div>
	);
};
