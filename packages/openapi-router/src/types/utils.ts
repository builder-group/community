export interface TParams {
	[key: string]: undefined | string | string[] | TParams | TParams[];
}

export type TParseParams = (params: TParams) => Record<string, unknown>;
