/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
    'Boolean': unknown;
    'Continent': { kind: 'OBJECT'; name: 'Continent'; fields: { 'code': { name: 'code'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'countries': { name: 'countries'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Country'; ofType: null; }; }; }; } }; 'name': { name: 'name'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; }; };
    'ContinentFilterInput': { kind: 'INPUT_OBJECT'; name: 'ContinentFilterInput'; isOneOf: false; inputFields: [{ name: 'code'; type: { kind: 'INPUT_OBJECT'; name: 'StringQueryOperatorInput'; ofType: null; }; defaultValue: null }]; };
    'Country': { kind: 'OBJECT'; name: 'Country'; fields: { 'awsRegion': { name: 'awsRegion'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'capital': { name: 'capital'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'code': { name: 'code'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'continent': { name: 'continent'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Continent'; ofType: null; }; } }; 'currencies': { name: 'currencies'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; }; } }; 'currency': { name: 'currency'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'emoji': { name: 'emoji'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'emojiU': { name: 'emojiU'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'languages': { name: 'languages'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Language'; ofType: null; }; }; }; } }; 'name': { name: 'name'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'native': { name: 'native'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'phone': { name: 'phone'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'phones': { name: 'phones'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; }; } }; 'states': { name: 'states'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'State'; ofType: null; }; }; }; } }; 'subdivisions': { name: 'subdivisions'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Subdivision'; ofType: null; }; }; }; } }; }; };
    'CountryFilterInput': { kind: 'INPUT_OBJECT'; name: 'CountryFilterInput'; isOneOf: false; inputFields: [{ name: 'code'; type: { kind: 'INPUT_OBJECT'; name: 'StringQueryOperatorInput'; ofType: null; }; defaultValue: null }, { name: 'continent'; type: { kind: 'INPUT_OBJECT'; name: 'StringQueryOperatorInput'; ofType: null; }; defaultValue: null }, { name: 'currency'; type: { kind: 'INPUT_OBJECT'; name: 'StringQueryOperatorInput'; ofType: null; }; defaultValue: null }, { name: 'name'; type: { kind: 'INPUT_OBJECT'; name: 'StringQueryOperatorInput'; ofType: null; }; defaultValue: null }]; };
    'ID': unknown;
    'Language': { kind: 'OBJECT'; name: 'Language'; fields: { 'code': { name: 'code'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'countries': { name: 'countries'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Country'; ofType: null; }; }; }; } }; 'name': { name: 'name'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'native': { name: 'native'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'rtl': { name: 'rtl'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null; }; } }; }; };
    'LanguageFilterInput': { kind: 'INPUT_OBJECT'; name: 'LanguageFilterInput'; isOneOf: false; inputFields: [{ name: 'code'; type: { kind: 'INPUT_OBJECT'; name: 'StringQueryOperatorInput'; ofType: null; }; defaultValue: null }]; };
    'Query': { kind: 'OBJECT'; name: 'Query'; fields: { 'continent': { name: 'continent'; type: { kind: 'OBJECT'; name: 'Continent'; ofType: null; } }; 'continents': { name: 'continents'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Continent'; ofType: null; }; }; }; } }; 'countries': { name: 'countries'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Country'; ofType: null; }; }; }; } }; 'country': { name: 'country'; type: { kind: 'OBJECT'; name: 'Country'; ofType: null; } }; 'language': { name: 'language'; type: { kind: 'OBJECT'; name: 'Language'; ofType: null; } }; 'languages': { name: 'languages'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Language'; ofType: null; }; }; }; } }; }; };
    'State': { kind: 'OBJECT'; name: 'State'; fields: { 'code': { name: 'code'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'country': { name: 'country'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Country'; ofType: null; }; } }; 'name': { name: 'name'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; }; };
    'String': unknown;
    'StringQueryOperatorInput': { kind: 'INPUT_OBJECT'; name: 'StringQueryOperatorInput'; isOneOf: false; inputFields: [{ name: 'eq'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; }; defaultValue: null }, { name: 'in'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; }; defaultValue: null }, { name: 'ne'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; }; defaultValue: null }, { name: 'nin'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; }; defaultValue: null }, { name: 'regex'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; }; defaultValue: null }]; };
    'Subdivision': { kind: 'OBJECT'; name: 'Subdivision'; fields: { 'code': { name: 'code'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'emoji': { name: 'emoji'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'name': { name: 'name'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; }; };
};

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
  name: never;
  query: 'Query';
  mutation: never;
  subscription: never;
  types: introspection_types;
};

import * as gqlTada from 'gql.tada';

declare module 'gql.tada' {
  interface setupSchema {
    introspection: introspection
  }
}