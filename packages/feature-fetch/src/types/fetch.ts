export type THeadersInit = NonNullable<RequestInit['headers']>;
export type TRequestMethod = NonNullable<RequestInit['method']>;

export interface TBodyType<GJson = unknown> {
	json: GJson;
	text: Awaited<ReturnType<Response['text']>>;
	blob: Awaited<ReturnType<Response['blob']>>;
	arrayBuffer: Awaited<ReturnType<Response['arrayBuffer']>>;
	stream: Response['body'];
}

export type TParseAs = keyof TBodyType;

export type TParseAsResponse<
	GParseAs extends TParseAs,
	GJson = unknown
> = TBodyType<GJson>[GParseAs];
