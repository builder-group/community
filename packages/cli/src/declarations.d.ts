declare module 'maxmin' {
	function maxmin(
		max: string | Buffer | number,
		min: string | Buffer | number,
		useGzip?: boolean
	): string;
	export = maxmin;
}
