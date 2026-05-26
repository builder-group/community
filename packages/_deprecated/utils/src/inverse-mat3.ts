import type { TMat3 } from './types';

export function inverseMat3(mat: TMat3): TMat3 | null {
	const det = determinantMat3(mat);
	if (det === 0) {
		return null; // Singular matrix, no inverse exists
	}

	const cofactorMat = cofactorMat3(mat);
	const adjugateMat = transposeMat3(cofactorMat);

	const inverseMat: TMat3 = [
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0]
	];

	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 3; j++) {
			// @ts-expect-error -- It can't be null because we enforce Mat3
			inverseMat[i][j] = adjugateMat[i][j] / det;
		}
	}

	return inverseMat;
}

function determinantMat3(mat: TMat3): number {
	return (
		mat[0][0] * (mat[1][1] * mat[2][2] - mat[1][2] * mat[2][1]) -
		mat[0][1] * (mat[1][0] * mat[2][2] - mat[1][2] * mat[2][0]) +
		mat[0][2] * (mat[1][0] * mat[2][1] - mat[1][1] * mat[2][0])
	);
}

function cofactorMat3(mat: TMat3): TMat3 {
	return [
		[
			mat[1][1] * mat[2][2] - mat[1][2] * mat[2][1],
			-(mat[1][0] * mat[2][2] - mat[1][2] * mat[2][0]),
			mat[1][0] * mat[2][1] - mat[1][1] * mat[2][0]
		],
		[
			-(mat[0][1] * mat[2][2] - mat[0][2] * mat[2][1]),
			mat[0][0] * mat[2][2] - mat[0][2] * mat[2][0],
			-(mat[0][0] * mat[2][1] - mat[0][1] * mat[2][0])
		],
		[
			mat[0][1] * mat[1][2] - mat[0][2] * mat[1][1],
			-(mat[0][0] * mat[1][2] - mat[0][2] * mat[1][0]),
			mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0]
		]
	];
}

function transposeMat3(mat: TMat3): TMat3 {
	return [
		[mat[0][0], mat[1][0], mat[2][0]],
		[mat[0][1], mat[1][1], mat[2][1]],
		[mat[0][2], mat[1][2], mat[2][2]]
	];
}
