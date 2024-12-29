import { TFormFieldStatus } from 'feature-form';
import { useFeatureState } from 'feature-react/state';
import React from 'react';

export const StatusMessage: React.FC<TProps> = (props) => {
	const { $status } = props;
	const status = useFeatureState($status);

	if (status.type === 'INVALID') {
		return <p className={'error'}>{status.errors[0].message}</p>;
	}

	return null;
};

interface TProps {
	$status: TFormFieldStatus;
}
