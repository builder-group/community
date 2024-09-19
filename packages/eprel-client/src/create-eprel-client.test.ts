import { beforeAll, describe, expect, it } from 'vitest';

import { createEPRELClient } from './create-eprel-client';

// 550826
// electronicdisplays

describe('createEPRELClient function tests', () => {
	let client: ReturnType<typeof createEPRELClient>;

	beforeAll(() => {
		client = createEPRELClient({
			apiKey: 'YOUR_API_KEY'
		});
	});

	it('should retrieve product groups successfully', async () => {
		const productGroupsResult = await client.getProductGroups();
		// const productGroupsResult = await client.get('/product-groups');
		expect(productGroupsResult.isOk()).toBeTruthy();
	});

	it('should retrieve a specific product successfully', async () => {
		const productResult = await client.getProductByRegistrationNumber('550826');
		// const productResult = await client.get('/product/{registrationNumber}', {
		// 	pathParams: {
		// 		registrationNumber: '550826'
		// 	}
		// });
		expect(productResult.isOk()).toBeTruthy();
	});

	it('should retrieve product sheets successfully', async () => {
		const productSheetsResult = await client.getProductSheets('550826', { noRedirect: true });
		// const productSheetsResult = await client.get('/product/{registrationNumber}/fiches', {
		// 	pathParams: {
		// 		registrationNumber: '550826'
		// 	},
		// 	queryParams: {
		// 		noRedirect: true
		// 	},
		// 	parseAs: 'json'
		// });
		expect(productSheetsResult.isOk()).toBeTruthy();
	});

	it('should retrieve product sheet urls successfully', async () => {
		const productSheetUrlsResult = await client.getProductSheetUrls('550826');
		expect(productSheetUrlsResult.isOk()).toBeTruthy();
	});

	it('should retrieve product sheet url successfully', async () => {
		const productSheetUrlResult = await client.getProductSheetUrl('550826', 'EN');
		expect(productSheetUrlResult.isOk()).toBeTruthy();
	});

	it('should retrieve product labels successfully', async () => {
		const productLabelsResult = await client.getProductLabels('550826', { noRedirect: true });
		// const productLabelsResult = await client.get('/product/{registrationNumber}/labels', {
		// 	pathParams: {
		// 		registrationNumber: '550826'
		// 	},
		// 	queryParams: {
		// 		noRedirect: true
		// 	},
		// 	parseAs: 'json'
		// });
		expect(productLabelsResult.isOk()).toBeTruthy();
	});

	it('should retrieve product label url successfully', async () => {
		const productLabelUrlResult = await client.getProductLabelUrl('550826', 'PNG');
		expect(productLabelUrlResult.isOk()).toBeTruthy();
	});

	it('should retrieve a nested label for a product successfully', async () => {
		const productNestedLabelResult = await client.getNestedLabel('550826');
		// const productNestedLabelResult = await client.get(
		// 	'/product/{registrationNumber}/nested-label',
		// 	{
		// 		pathParams: {
		// 			registrationNumber: '550826'
		// 		},
		// 		parseAs: 'blob'
		// 	}
		// );
		expect(productNestedLabelResult.isOk()).toBeTruthy();
	});

	it('should retrieve products in a product group successfully', async () => {
		const productsInProductGroupResult = await client.getModelsInProductGroup('airconditioners');
		// const productsInProductGroupResult = await client.get('/products/{productGroup}', {
		// 	pathParams: {
		// 		productGroup: 'airconditioners'
		// 	},
		// 	queryParams: {}
		// });
		expect(productsInProductGroupResult.isOk()).toBeTruthy();
	});
});
