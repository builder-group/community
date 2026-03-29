import type { TemplateResult } from 'lit';

export type TSplitFlapVariant = 'minimal' | 'realistic';

export type TSpool = TFlap[];
export type TGrid = string[][];

export type TFlap = TFlapChar | TFlapColor | TFlapImage | TFlapCustom;

export interface TFlapChar {
	type: 'char';
	key?: string;
	value: string;
	color?: string;
	bg?: string;
	fontSize?: string;
	fontFamily?: string;
	fontWeight?: string;
}

export interface TFlapColor {
	type: 'color';
	key?: string;
	value: string;
}

export interface TFlapImage {
	type: 'image';
	key?: string;
	src: string;
	alt?: string;
}

export interface TFlapCustom {
	type: 'custom';
	key: string;
	top: TemplateResult;
	bottom: TemplateResult;
}

export interface TBoardData {
	spools: TSpool[][];
	grid: TGrid;
}

export interface TLineConfig {
	text: string;
	bg?: string;
	color?: string;
}

export type TLineInput = string | TLineConfig;

export interface TSpoolSettledDetail {
	value: string;
}

export interface TBoardSettledDetail {
	grid: TGrid;
}
