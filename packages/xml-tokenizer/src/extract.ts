import { tokenize, type TXmlStreamOptions, type TXmlToken } from './tokenizer';

export function extract<GExtractors extends TExtractor[]>(
	xml: string,
	extractors: [...GExtractors],
	options?: TXmlStreamOptions
): TMergeExtractorContexts<GExtractors> {
	validateExtractorOrder(extractors);

	// Build shared context
	const context: TMergeExtractorContexts<GExtractors> = {} as TMergeExtractorContexts<GExtractors>;
	for (const extractor of extractors) {
		Object.assign(context, extractor.context);
	}

	// Process tokens
	tokenize(
		xml,
		(token) => {
			for (const extractor of extractors) {
				extractor.extract(token, context);
			}
		},
		options
	);

	return context;
}

function validateExtractorOrder(extractors: TExtractor[]) {
	const seen = new Set<TExtractor>();

	for (const ext of extractors) {
		if (ext.deps == null) {
			continue;
		}

		for (const dep of ext.deps) {
			if (!seen.has(dep)) {
				throw new Error(
					`Extractor dependency order invalid: one extractor depends on another that hasn't run yet.`
				);
			}
		}

		seen.add(ext);
	}
}

export interface TExtractor<GContext = any, GDeps extends TExtractor[] = []> {
	context: GContext;
	deps?: GDeps;
	extract: TTokenCallback<GContext & TMergeExtractorContexts<GDeps>>;
}

type TTokenCallback<GContext = any> = (token: TXmlToken, context: GContext) => void;

type TExtractorContext<GExtractor extends TExtractor> =
	GExtractor extends TExtractor<infer C, any> ? C : never;

type TMergeExtractorContexts<GExtractors extends TExtractor[]> = GExtractors extends [
	infer H,
	...infer R
]
	? TExtractorContext<H & TExtractor> & TMergeExtractorContexts<TCastToExtractors<R>>
	: {};

type TCastToExtractors<T extends unknown[]> = T extends TExtractor[] ? T : [];
