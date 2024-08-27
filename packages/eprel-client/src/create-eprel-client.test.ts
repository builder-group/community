import { beforeAll, describe, expect, it } from 'vitest';

import { createEPRELClient } from './create-eprel-client';

describe('createEPRELClient function tests', () => {
	let client: ReturnType<typeof createEPRELClient>;

	beforeAll(() => {
		client = createEPRELClient({
			apiKey: 'YOUR_API_KEY'
		});
	});

	it('should retrieve product groups successfully', async () => {
		const productsResult = await client.get('/product-groups');
		const productGroups = await client.getProductGroups();
		expect(productsResult.isOk()).toBeTruthy();
	});

	it('should retrieve a specific product successfully', async () => {
		const productResult = await client.get('/product/{registrationNumber}', {
			pathParams: {
				registrationNumber: '15414'
			}
		});
		const product = await client.getProductByRegistrationNumber('15414');
		expect(productResult.isOk()).toBeTruthy();
	});

	it('should retrieve product fiches successfully', async () => {
		const productFichesResult = await client.get('/product/{registrationNumber}/fiches', {
			pathParams: {
				registrationNumber: '15414'
			},
			queryParams: {
				noRedirect: true
			},
			parseAs: 'json'
		});
		const productFiches = await client.getProductFiches('15414', { noRedirect: true });
		expect(productFichesResult.isOk()).toBeTruthy();
	});

	it('should retrieve product labels successfully', async () => {
		const productLabelsResult = await client.get('/product/{registrationNumber}/labels', {
			pathParams: {
				registrationNumber: '15414'
			},
			queryParams: {
				noRedirect: true
			},
			parseAs: 'json'
		});
		const productLabels = await client.getProductLabels('15414', { noRedirect: true });
		expect(productLabelsResult.isOk()).toBeTruthy();
	});

	it('should retrieve a nested label for a product successfully', async () => {
		const productNestedLabelResult = await client.get(
			'/product/{registrationNumber}/nested-label',
			{
				pathParams: {
					registrationNumber: '15414'
				},
				parseAs: 'blob'
			}
		);
		const productNestedLabel = await client.getNestedLabel('15414');
		expect(productNestedLabelResult.isOk()).toBeTruthy();
	});

	it('should retrieve products in a product group successfully', async () => {
		const productsInProductGroupResult = await client.get('/products/{productGroup}', {
			pathParams: {
				productGroup: 'airconditioners'
			},
			queryParams: {}
		});
		const productsIngroup = await client.getModelsInProductGroup('airconditioners');
		expect(productsInProductGroupResult.isOk()).toBeTruthy();
	});
});

// {
//     code: "AIR_CONDITIONER",
//     url_code: "airconditioners",
//     name: "Air conditioners",
//     regulation: "Regulation (EU) 626/2011",
// }

// eprelRegistrationNumber: '15414'
