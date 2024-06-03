import * as ts from 'typescript';

export function findNearestTsConfigPath(startPoint = './'): string | undefined {
	return ts.findConfigFile(startPoint, ts.sys.fileExists);
}
