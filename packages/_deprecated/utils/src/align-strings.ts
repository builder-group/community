export function alignStrings(strings: string[], options: TAlignStringsOptions = {}) {
	const { separator = '  ' } = options;

	if (!strings.length) {
		return '';
	}

	// Split each string into lines
	const lineArrays = strings.map((str) => (str || '').split('\n'));

	// Find the maximum number of lines across all strings
	const maxLines = Math.max(...lineArrays.map((lines) => lines.length));

	// Find the maximum length across all lines in all strings
	const maxLength = Math.max(...lineArrays.flat().map((line) => line.length));

	// Pad each array with empty strings if needed
	const paddedLines = lineArrays.map((lines) => {
		const padded = [...lines];
		while (padded.length < maxLines) {
			padded.push('');
		}
		return padded.map((line) => line.padEnd(maxLength, ' '));
	});

	// Combine lines horizontally
	return Array(maxLines)
		.fill('')
		.map((_, lineIndex) => paddedLines.map((lines) => lines[lineIndex]).join(separator))
		.join('\n');
}

interface TAlignStringsOptions {
	separator?: string;
}
