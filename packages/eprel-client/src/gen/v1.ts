/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
	'/product-groups': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Get list of product groups
		 * @description Returns a list of product groups with their associated regulation details.
		 */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path?: never;
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'application/json': components['schemas']['ProductGroupList'];
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	'/products/{productGroup}': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Get models in a product group
		 * @description Retrieve all models within a specific product group.
		 */
		get: {
			parameters: {
				query?: {
					/** @description Page number for pagination. */
					_page?: components['parameters']['Page'];
					/** @description Number of results per page (min 1, max 100). */
					_limit?: components['parameters']['Limit'];
					/** @description Primary sorting field. Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
					sort0?: components['parameters']['Sort0'];
					/** @description Primary sorting order (ASC or DESC). Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
					order0?: components['parameters']['Order0'];
					/** @description Primary sorting field. Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
					sort1?: components['parameters']['Sort1'];
					/** @description Primary sorting order (ASC or DESC). Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
					order1?: components['parameters']['Order1'];
					/** @description Primary sorting field. Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
					sort2?: components['parameters']['Sort2'];
					/** @description Primary sorting order (ASC or DESC). Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
					order2?: components['parameters']['Order2'];
					/** @description Include products that are no longer on the market. */
					includeOldProducts?: components['parameters']['IncludeOldProducts'];
				};
				header?: never;
				path: {
					/** @description The product group (e.g., ovens, electronicdisplays). */
					productGroup: components['parameters']['ProductGroup'];
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'application/json': components['schemas']['ModelsList'];
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	'/product/{registrationNumber}': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Get a product by registration number
		 * @description Retrieves detailed information about a product using its registration number.
		 */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path: {
					/** @description Unique identifier of the model in the EPREL database. */
					registrationNumber: components['parameters']['RegistrationNumber'];
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'application/json': components['schemas']['ModelDetails'];
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	'/product/{registrationNumber}/fiches': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Retrieve Product Fiche
		 * @description Retrieves the product information sheet (fiche) in PDF format for a specific model.
		 */
		get: {
			parameters: {
				query?: {
					/** @description If true, returns the address of the file without redirection. */
					noRedirect?: components['parameters']['NoRedirect'];
					/** @description The language in which the fiche should be returned. If not specified, all languages will be returned in a ZIP file. */
					language?: components['parameters']['FicheLanguage'];
				};
				header?: never;
				path: {
					/** @description Unique identifier of the model in the EPREL database. */
					registrationNumber: components['parameters']['RegistrationNumber'];
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response containing the fiche. */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'application/zip': string;
						'application/pdf': string;
						'application/json': components['schemas']['FileAddress'];
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	'/product/{registrationNumber}/labels': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Retrieve Product Label
		 * @description Retrieves the label for a specific model in the specified format(s).
		 */
		get: {
			parameters: {
				query?: {
					/** @description If true, returns the address of the file without redirection. */
					noRedirect?: components['parameters']['NoRedirect'];
					/** @description The format in which the label should be returned. If not specified, all formats will be returned. */
					format?: components['parameters']['LabelFormat'];
					/** @description Used only for domestic ovens, indicating the cavity number. */
					instance?: components['parameters']['Instance'];
					/** @description If true, returns the supplier's label if it exists. */
					supplier_label?: components['parameters']['SupplierLabel'];
					/** @description Used only for light sources to specify the type of label. */
					type?: components['parameters']['LabelType'];
				};
				header?: never;
				path: {
					/** @description Unique identifier of the model in the EPREL database. */
					registrationNumber: components['parameters']['RegistrationNumber'];
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response containing the label(s). */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'application/zip': string;
						'image/png': string;
						'image/svg+xml': string;
						'application/pdf': string;
						'application/json': components['schemas']['FileAddress'];
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	'/product/{registrationNumber}/nested-label': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Retrieve Nested Label
		 * @description Retrieves the nested label (SVG image of the arrow with energy efficiency class) for a specific model.
		 */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path: {
					/** @description Unique identifier of the model in the EPREL database. */
					registrationNumber: components['parameters']['RegistrationNumber'];
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response containing the nested label. */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'image/svg+xml': string;
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	'/products/{productGroup}/{registrationNumber}': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Retrieve Model Details by Product Group
		 * @description Retrieves detailed information about a product model within a specific product group using its unique registration number.
		 */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path: {
					/** @description The product group (e.g., ovens, electronicdisplays). */
					productGroup: components['parameters']['ProductGroup'];
					/** @description Unique identifier of the model in the EPREL database. */
					registrationNumber: components['parameters']['RegistrationNumber'];
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'application/json': components['schemas']['ModelsList'];
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	'/products/{productGroup}/{registrationNumber}/fiches': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Retrieve Product Fiche
		 * @description Retrieves the product information sheet (fiche) in PDF format for a specific model.
		 */
		get: {
			parameters: {
				query?: {
					/** @description If true, returns the address of the file without redirection. */
					noRedirect?: components['parameters']['NoRedirect'];
					/** @description The language in which the fiche should be returned. If not specified, all languages will be returned in a ZIP file. */
					language?: components['parameters']['FicheLanguage'];
				};
				header?: never;
				path: {
					/** @description The product group (e.g., ovens, electronicdisplays). */
					productGroup: components['parameters']['ProductGroup'];
					/** @description Unique identifier of the model in the EPREL database. */
					registrationNumber: components['parameters']['RegistrationNumber'];
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response containing the fiche. */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'application/zip': string;
						'application/pdf': string;
						'application/json': components['schemas']['FileAddress'];
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	'/products/{productGroup}/{registrationNumber}/labels': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Retrieve Product Label
		 * @description Retrieves the label for a specific model in the specified format(s).
		 */
		get: {
			parameters: {
				query?: {
					/** @description If true, returns the address of the file without redirection. */
					noRedirect?: components['parameters']['NoRedirect'];
					/** @description The format in which the label should be returned. If not specified, all formats will be returned. */
					format?: components['parameters']['LabelFormat'];
					/** @description Used only for domestic ovens, indicating the cavity number. */
					instance?: components['parameters']['Instance'];
					/** @description If true, returns the supplier's label if it exists. */
					supplier_label?: components['parameters']['SupplierLabel'];
					/** @description Used only for light sources to specify the type of label. */
					type?: components['parameters']['LabelType'];
				};
				header?: never;
				path: {
					/** @description The product group (e.g., ovens, electronicdisplays). */
					productGroup: components['parameters']['ProductGroup'];
					/** @description Unique identifier of the model in the EPREL database. */
					registrationNumber: components['parameters']['RegistrationNumber'];
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response containing the label(s). */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'application/zip': string;
						'image/png': string;
						'image/svg+xml': string;
						'application/pdf': string;
						'application/json': components['schemas']['FileAddress'];
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	'/exportProducts/{productGroup}': {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Get product group's models in a ZIP file
		 * @description Retrieves all models in a product group in a ZIP file. This endpoint is restricted by API key.
		 */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path: {
					/** @description The product group (e.g., ovens, electronicdisplays). */
					productGroup: components['parameters']['ProductGroup'];
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Successful response containing the ZIP file with model data. */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						'application/zip': string;
					};
				};
				'4XX': components['responses']['ClientError'];
				'5XX': components['responses']['ServerError'];
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
}
export type webhooks = Record<string, never>;
export interface components {
	schemas: {
		ProductGroupList: components['schemas']['ProductGroup'][];
		ProductGroup: {
			/** @example AIR_CONDITIONER */
			code: string;
			/** @example airconditioners */
			url_code: string;
			/** @example Air conditioners */
			name: string;
			/** @example Regulation (EU) 626/2011 */
			regulation: string;
		};
		ModelsList: {
			/** @example 1 */
			size?: number;
			/** @example 0 */
			offset?: number;
			hits?: components['schemas']['ModelDetails'][];
		};
		/** @description Only contains product group comprehensive properties (https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100878). */
		ModelDetails: {
			/** @example EU_2019_2017 */
			implementingAct?: string;
			/** @example P2422H */
			modelIdentifier?: string;
			/** @example [
			 *       2020,
			 *       5,
			 *       8
			 *     ] */
			onMarketStartDate?: number[];
			/** @example [
			 *       2020,
			 *       5,
			 *       8
			 *     ] */
			onMarketEndDate?: number[] | null;
			/** @example false */
			lastVersion?: boolean;
			/** @example 72 */
			versionId?: number;
			/**
			 * @example PUBLISHED
			 * @enum {string}
			 */
			status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
			/** @example 72 */
			eprelRegistrationNumber?: string;
			/** @example 72 */
			productModelCoreId?: number;
			/** @example A */
			energyClass?: string;
			/** @example arrow.png */
			energyClassImage?: string;
			contactDetails?: components['schemas']['ContactDetails'];
			/** @example 1 */
			versionNumber?: number;
			/** @example electronicdisplays */
			productGroup?: string;
			/**
			 * @example MANUFACTURER
			 * @enum {string}
			 */
			registrantNature?: 'AUTHORISED_REPRESENTATIVE' | 'IMPORTER' | 'MANUFACTURER';
			placementCountries?: {
				/** @example DE */
				country?: string;
				/** @example 1 */
				orderNumber?: number;
			}[];
		};
		ContactDetails: {
			/** @example Smith */
			lastName?: string;
			/** @example BE */
			country?: string;
			/** @example 1 */
			streetNumber?: string;
			/** @example Brussels */
			city?: string;
			/** @example 1000 */
			postalCode?: string;
			/** @example Brussels City */
			municipality?: string;
			/** @example Support service */
			serviceName?: string;
			/** @example support.service.co */
			webSiteURL?: string;
			/** @example John */
			firstName?: string;
			/** @example Main street 1, 1000 Brussels, BE */
			addressBloc?: string;
			/** @example Brussels-Capital */
			province?: string;
			/** @example +32123456789 */
			phone?: string;
			/** @example Main street */
			street?: string;
			/**
			 * Format: email
			 * @example support@service.co
			 */
			email?: string;
		};
		/** @description File address when noRedirect is set to true */
		FileAddress: {
			/**
			 * Format: uri
			 * @description [API_URL]/informationsheet/fiche_[REGISTRATION_NUMBER]_ES.pdf
			 * @example https://api.example.com/label/Label_117273.png
			 */
			address?: string;
		};
	};
	responses: {
		/** @description Client error */
		ClientError: {
			headers: {
				[name: string]: unknown;
			};
			content?: never;
		};
		/** @description Server error */
		ServerError: {
			headers: {
				[name: string]: unknown;
			};
			content?: never;
		};
	};
	parameters: {
		/** @description The product group (e.g., ovens, electronicdisplays). */
		ProductGroup: string;
		/** @description Unique identifier of the model in the EPREL database. */
		RegistrationNumber: string;
		/** @description Page number for pagination. */
		Page: number;
		/** @description Number of results per page (min 1, max 100). */
		Limit: number;
		/** @description Primary sorting field. Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
		Sort0: string;
		/** @description Primary sorting order (ASC or DESC). Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
		Order0: 'ASC' | 'DESC';
		/** @description Primary sorting field. Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
		Sort1: string;
		/** @description Primary sorting order (ASC or DESC). Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
		Order1: 'ASC' | 'DESC';
		/** @description Primary sorting field. Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
		Sort2: string;
		/** @description Primary sorting order (ASC or DESC). Belongs to list of sorting parameters and their direction to apply to the query in the format of sort0=[Field name]&order0=[ASC/DESC]. */
		Order2: 'ASC' | 'DESC';
		/** @description Include products that are no longer on the market. */
		IncludeOldProducts: boolean;
		/** @description If true, returns the address of the file without redirection. */
		NoRedirect: boolean;
		/** @description The language in which the fiche should be returned. If not specified, all languages will be returned in a ZIP file. */
		FicheLanguage:
			| 'BG'
			| 'CS'
			| 'DA'
			| 'DE'
			| 'ET'
			| 'EL'
			| 'EN'
			| 'ES'
			| 'FR'
			| 'GA'
			| 'HR'
			| 'IT'
			| 'LV'
			| 'LT'
			| 'HU'
			| 'MT'
			| 'NL'
			| 'PL'
			| 'PT'
			| 'RO'
			| 'SK'
			| 'SL'
			| 'FI'
			| 'SV';
		/** @description The format in which the label should be returned. If not specified, all formats will be returned. */
		LabelFormat: 'PNG' | 'PDF' | 'SVG';
		/** @description Used only for domestic ovens, indicating the cavity number. */
		Instance: number;
		/** @description If true, returns the supplier's label if it exists. */
		SupplierLabel: boolean;
		/** @description Used only for light sources to specify the type of label. */
		LabelType: 'BIG_BW' | 'BIG_COLOR' | 'SMALL_BW' | 'SMALL_COLOR';
	};
	requestBodies: never;
	headers: never;
	pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
