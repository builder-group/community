import { type TSheetLanguage } from '../types';

export const countryToSheetLanguage: Record<string, TSheetLanguage[]> = {
	// EU Member States
	AT: ['DE'],
	BE: ['NL', 'FR', 'DE'],
	BG: ['BG'],
	HR: ['HR'],
	CY: ['EL', 'EN'],
	CZ: ['CS'],
	DK: ['DA'],
	EE: ['ET'],
	FI: ['FI', 'SV'],
	FR: ['FR'],
	DE: ['DE'],
	EL: ['EL'],
	HU: ['HU'],
	IE: ['EN', 'GA'],
	IT: ['IT'],
	LV: ['LV'],
	LT: ['LT'],
	LU: ['DE', 'FR'],
	MT: ['MT', 'EN'],
	NL: ['NL'],
	PL: ['PL'],
	PT: ['PT'],
	RO: ['RO'],
	SK: ['SK'],
	SI: ['SL'],
	ES: ['ES'],
	SE: ['SV'],
	// EEA countries
	IS: ['EN'],
	LI: ['DE'],
	NO: ['EN'],
	// Other relevant territories
	XI: ['EN'], // Northern Ireland
	// Additional countries that might be relevant
	CH: ['DE', 'FR', 'IT'], // Switzerland
	MC: ['FR'], // Monaco
	SM: ['IT'], // San Marino
	VA: ['IT'], // Vatican City
	AD: ['ES'] // Andorra
};

export function getLanguageSet(
	placementCountries: {
		country?: string;
		orderNumber?: number;
	}[]
): Set<TSheetLanguage> {
	const languageSet = new Set<TSheetLanguage>();
	for (const placementCountry of placementCountries) {
		if (placementCountry.country != null) {
			const languages = countryToSheetLanguage[placementCountry.country];
			if (languages != null) {
				languages.forEach((lang) => languageSet.add(lang));
			}
		}
	}
	return languageSet;
}
