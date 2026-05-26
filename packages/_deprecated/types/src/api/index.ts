/**
 * -----------------------------------------------------------------------------
 * This file includes code derived from the project openapi-ts/openapi-typescript by \@drwpow.
 * Project Repository: https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript-helpers/index.d.ts
 *
 * Date of Import: 05 June 2024
 * -----------------------------------------------------------------------------
 * The code included in this file is licensed under the MIT License,
 * as per the original project by \@drwpow.
 * For the license text, see: https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript-helpers/LICENSE
 * -----------------------------------------------------------------------------
 */

import { type TFilterKeys } from '../utils';

/** Return HTTP methods */
export type THttpMethod =
	| 'get'
	| 'put'
	| 'post'
	| 'delete'
	| 'options'
	| 'head'
	| 'patch'
	| 'trace';

/** Return 2XX status codes */
export type TOkStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207 | '2XX';

/** Return 4XX and 5XX status codes */
export type TErrorStatus =
	| 500
	| 501
	| 502
	| 503
	| 504
	| 505
	| 506
	| 507
	| 508
	| 510
	| 511
	| '5XX'
	| 400
	| 401
	| 402
	| 403
	| 404
	| 405
	| 406
	| 407
	| 408
	| 409
	| 410
	| 411
	| 412
	| 413
	| 414
	| 415
	| 416
	| 417
	| 418
	| 420
	| 421
	| 422
	| 423
	| 424
	| 425
	| 426
	| 427
	| 428
	| 429
	| 430
	| 431
	| 444
	| 450
	| 451
	| 497
	| 498
	| 499
	| '4XX'
	| 'default';

/** Return any `[string]/[string]` media type */
export type TMediaType = `${string}/${string}`;

/** Return any media type containing "json" (works for "application/json", "application/vnd.api+json", "application/vnd.oai.openapi+json") */
export type JSONLike<T> = TFilterKeys<T, `${string}/json`>;
