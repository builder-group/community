import * as fxp from 'fast-xml-parser';
import { xmlToObject } from 'roxmltree';
import * as txml from 'txml';
import * as xml2js from 'xml2js';

import { bench } from './bench';
import { parse } from './txml';

const xmlResult = await fetch('http://localhost:5173/midsize.xml');
const xml = await xmlResult.text();

console.log({ xml });

const fastXmlParser = new fxp.XMLParser();

const runs = 100;

bench('xmlToObject', () => xmlToObject(xml), runs);
bench('txml-ts', () => parse(xml), runs);
bench('txml', () => txml.parse(xml), runs);
bench('fast-xml-parser', () => fastXmlParser.parse(xml), runs);
bench('xml2js', () => xml2js.parseString(xml, () => {}), runs);
