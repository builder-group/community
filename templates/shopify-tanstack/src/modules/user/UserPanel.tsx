import React from 'react';

export const UserPanel: React.FC<TUserPanelProps> = (props) => {
	const { user } = props;

	return (
		<s-stack direction="block" gap="base">
			<s-text>{`${user.firstName} ${user.lastName}`}</s-text>
			<s-text>{user.email}</s-text>
			<s-text>{user.accountOwner ? 'Shop owner' : 'Staff member'}</s-text>
		</s-stack>
	);
};

interface TUserPanelProps {
	user: {
		firstName: string;
		lastName: string;
		email: string;
		accountOwner: boolean;
	};
}
