import { htmlConfig, select, TXmlNode } from 'xml-tokenizer';
import { TExtractCollectionKeys, TExtractors, TExtractSingleKeys } from './types';

export function extractHeadMetadata<GExtractors extends TExtractors>(
	html: string,
	extractors: GExtractors
): TExtractMetadata<GExtractors> {
	const metadata: TExtractMetadata<GExtractors> = Object.keys(extractors).reduce((acc, key) => {
		// @ts-expect-error -- We know that the key is a valid key since it comes from the extractors object
		acc[key] = {};
		return acc;
	}, {} as TExtractMetadata<GExtractors>);
	const stack: TXmlNode[] = [];

	select(
		html,
		[[{ axis: 'self-or-descendant', local: 'head' }]],
		(token, stream) => {
			switch (token.type) {
				// Since HTML only has one head element, we can just go to the end of the file
				// after we've processed the first head element
				case 'SelectionEnd': {
					stream.goToEnd();
					break;
				}
				case 'ElementStart': {
					if (token.local in extractors) {
						const newNode: TXmlNode = {
							local: token.local,
							prefix: token.prefix.length > 0 ? token.prefix : undefined,
							attributes: [],
							content: []
						};

						const currentNode = stack[stack.length - 1];
						if (currentNode != null) {
							currentNode.content.push(newNode);
						}

						stack.push(newNode);
					}
					break;
				}
				case 'ElementEnd': {
					if (token.end.type === 'Close' || token.end.type === 'Empty') {
						const node = stack[stack.length - 1];
						if (node == null) {
							break;
						}

						const extractor = extractors[node.local];
						if (extractor != null) {
							switch (extractor.type) {
								case 'collection': {
									const result = extractor.callback(node);
									if (result != null) {
										(metadata as any)[extractor.parent][result.key] = result.value;
									}
									break;
								}
								case 'single': {
									const value = extractor.callback(node);
									if (value != null) {
										(metadata as any)[extractor.key] = value;
									}
									break;
								}
							}
						}

						stack.pop();
					}
					break;
				}
				case 'Attribute': {
					const currentNode = stack[stack.length - 1];
					if (currentNode != null) {
						currentNode.attributes.push({
							local: token.local,
							prefix: token.prefix.length > 0 ? token.prefix : undefined,
							value: token.value
						});
					}
					break;
				}
				case 'Text':
				case 'Cdata': {
					const currentNode = stack[stack.length - 1];
					if (currentNode != null) {
						const trimmedText = token.text.trim();
						if (trimmedText.length > 0) {
							currentNode.content.push(token.text);
						}
					}
					break;
				}
				case 'Comment':
				case 'ProcessingInstruction':
				case 'EntityDeclaration':
				case 'SelectionStart':
			}
		},
		htmlConfig
	);

	return metadata;
}

export type TExtractMetadata<GExtractors extends TExtractors> = {
	// Single value fields
	[K in TExtractSingleKeys<GExtractors>]: string;
} & {
	// Collection fields
	[K in TExtractCollectionKeys<GExtractors>]: Record<string, string>;
};
