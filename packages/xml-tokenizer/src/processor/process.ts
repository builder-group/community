import { tokenize, type TXmlStreamOptions } from '../tokenizer';
import { TMergeProcessorContexts, TProcessorAny } from './types';
import { validateProcessorOrder } from './validate-processor-order';

export function process<GProcessors extends readonly TProcessorAny[]>(
	xml: string,
	processors: [...GProcessors],
	options?: TXmlStreamOptions
): TMergeProcessorContexts<GProcessors> {
	validateProcessorOrder(processors);

	// Build shared context
	const context: TMergeProcessorContexts<GProcessors> = {} as TMergeProcessorContexts<GProcessors>;
	for (const processor of processors) {
		Object.assign(context, processor.context);
	}

	// Process tokens
	tokenize(
		xml,
		(token) => {
			for (const processor of processors) {
				processor.process?.(token, context);
			}
		},
		options
	);

	return context;
}
