export class StrSpan {
	public readonly text: string;
	public readonly start: number;

	public constructor(text: string, start = 0) {
		this.text = text;
		this.start = start;
	}

	public static fromSubstr(text: string, start: number, end: number): StrSpan {
		return new StrSpan(text.substring(start, end), start);
	}

	public getRange(): [number, number] {
		return [this.start, this.start + this.text.length];
	}

	public sliceRegion(start: number, end: number): string {
		return this.text.substring(start, end);
	}
}
