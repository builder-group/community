import { createGraphQLFetchClient } from 'feature-fetch';
import { gql } from './gql';

const countriesFetchClient = createGraphQLFetchClient({
	baseUrl: 'https://countries.trevorblades.com/graphql'
});

const COUNTRY_QUERY = gql(`
	query Country($code: ID!) {
		country(code: $code) {
			code
			name
			emoji
			capital
			currency
		}
	}
`);

export async function fetchCountryWithGraphQLFetchClient(code: string): Promise<void> {
	const [isOk, error, countryData] = await countriesFetchClient.query(COUNTRY_QUERY, {
		variables: {
			code
		}
	});

	if (!isOk) {
		console.error('[graphql] Error Result', { error });
		return;
	}

	console.log('[graphql] Ok Result', { country: countryData.country });
}
