import { TXmlToken } from '../tokenizer';

export interface TProcessor<GContext = any, GDeps extends readonly TProcessorAny[] = readonly []> {
	name?: string;
	context: GContext;
	deps?: GDeps;
	process?: TTokenCallback<GContext & TMergeProcessorContexts<GDeps>>;
}

export type TProcessorAny = TProcessor<any, any>;

export type TTokenCallback<GContext = any> = (token: TXmlToken, context: GContext) => void;

export type TProcessorContext<GProcessor extends TProcessorAny> =
	GProcessor extends TProcessor<infer C, any> ? C : never;

export type TMergeProcessorContexts<GProcessors extends readonly TProcessorAny[]> =
	GProcessors extends readonly [infer H, ...infer R]
		? TProcessorContext<H & TProcessorAny> & TMergeProcessorContexts<TCastToProcessors<R>>
		: {};

export type TCastToProcessors<T extends readonly unknown[]> = T extends readonly TProcessorAny[]
	? T
	: readonly [];
