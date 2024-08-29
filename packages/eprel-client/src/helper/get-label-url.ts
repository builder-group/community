import { type TLabelFormat } from '../types';

export function getLabelUrl(
	productGroup: string,
	registrationNumber: string,
	format: TLabelFormat
): string {
	// `https://eprel.ec.europa.eu/api/products/${productGroup}/${registrationNumber}/labels?format=${format}`
	// https://eprel.ec.europa.eu/labels/electronicdisplays/Label_550826.png
	return `https://eprel.ec.europa.eu/labels/${productGroup}/Label_${registrationNumber}.${format.toLowerCase()}`;
}
