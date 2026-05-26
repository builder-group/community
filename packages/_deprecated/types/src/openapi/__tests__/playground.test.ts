/* eslint-disable @typescript-eslint/no-unused-vars -- Type testing*/

import {
	TOperationErrorResponseContent,
	TOperationResponseContent,
	type TOperationResponses,
	type TOperationSuccessResponseContent
} from '../index';
import { type paths } from './resources/mock-openapi-types';

type TestTOperationResponses = TOperationResponses<paths['/pet/{petId}']['get']>;
type TestTOperationSuccessResponseContent = TOperationSuccessResponseContent<
	paths['/pet/{petId}']['get']
>;
type TestTOperationErrorResponseContent = TOperationErrorResponseContent<
	paths['/pet/{petId}']['get']
>;
type TestTOperationResponseContent = TOperationResponseContent<paths['/pet/{petId}']['get'], 200>;
