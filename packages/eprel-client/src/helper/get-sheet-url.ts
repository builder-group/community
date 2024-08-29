import { type TSheetLanguage } from '../types';

export function getSheetUrl(
	productGroup: string,
	registrationNumber: string,
	language: TSheetLanguage
): string {
	// `https://eprel.ec.europa.eu/api/products/${productGroup}/${registrationNumber}/fiches?language=${language}`
	// https://eprel.ec.europa.eu/fiches/electronicdisplays/Fiche_550826_EN.pdf
	return `https://eprel.ec.europa.eu/fiches/${productGroup}/Fiche_${registrationNumber}_${language as string}.pdf`;
}
