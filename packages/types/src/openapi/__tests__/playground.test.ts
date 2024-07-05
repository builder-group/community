/* eslint-disable @typescript-eslint/no-unused-vars -- Type testing*/

import {
	type TOperationResponses,
	type TOperationSuccessResponseContent,
	type TSuccessResponseMediaContent
} from '../index';
import { type paths } from './resources/mock-openapi-types';

type TestTOperationResponses = TOperationResponses<paths['/pet/{petId}']['get']>;
type TestTSuccessResponseMediaContent = TSuccessResponseMediaContent<TestTOperationResponses>;
type TestTOperationSuccessResponseContent = TOperationSuccessResponseContent<
	paths['/pet/{petId}']['get']
>;
