import type { TemplateResult } from 'lit';

export type TSpool = TFlap[];

export type TFlap = TFlapChar | TFlapColor | TFlapImage | TFlapCustom;

export interface TFlapChar {
	type: 'char';
	key?: string;
	value: string;
	color?: string;
	bg?: string;
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
	top: TemplateResult | (() => HTMLElement);
	bottom: TemplateResult | (() => HTMLElement);
}
