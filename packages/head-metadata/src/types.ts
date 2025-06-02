export interface TXmlNode {
	local: string;
	prefix?: string;
	attributes: { local: string; prefix?: string; value: string }[];
	content: (TXmlNode | string)[];
}

export type TCollectionExtractor = {
	type: 'collection';
	parent: string;
	callback: (node: TXmlNode) => { key: string; value: string } | null;
};

export type TSingleExtractor = {
	type: 'single';
	key: string;
	callback: (node: TXmlNode) => string | null;
};

export type TExtractor = TCollectionExtractor | TSingleExtractor;

export type TExtractors = {
	[K: string]: TExtractor;
};

export type TExtractCollectionKeys<GExtractors extends TExtractors> = {
	[K in keyof GExtractors]: GExtractors[K] extends TCollectionExtractor
		? GExtractors[K]['parent']
		: never;
}[keyof GExtractors];

export type TExtractSingleKeys<GExtractors extends TExtractors> = {
	[K in keyof GExtractors]: GExtractors[K] extends TSingleExtractor ? GExtractors[K]['key'] : never;
}[keyof GExtractors];
