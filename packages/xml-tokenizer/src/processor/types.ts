import { TXmlToken } from '../tokenizer';

export interface TProcessor<GContext = unknown, GDeps extends readonly TProcessorAny[] = []> {
	name?: string;
	context: GContext;
	deps?: GDeps;
	process?: TTokenCallback<GContext & TMergeProcessorContexts<GDeps>>;
}

export type TProcessorAny = TProcessor<any, any>;

export type TTokenCallback<GContext = unknown> = (token: TXmlToken, context: GContext) => void;

export type TMergeProcessorContexts<GProcessors extends readonly TProcessorAny[]> =
	GProcessors extends [infer Head, ...infer Tail]
		? Head extends TProcessorAny
			? Tail extends readonly TProcessorAny[]
				? Head['context'] & TMergeProcessorContexts<Tail>
				: Head['context']
			: {}
		: {};
