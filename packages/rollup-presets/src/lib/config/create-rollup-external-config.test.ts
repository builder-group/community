import type { PackageJson } from 'type-fest';
import { describe, expect, it } from 'vitest';
import { createRollupExternalConfig } from './create-rollup-external-config';

describe('createRollupExternalConfig', () => {
	const mockPackageJson: PackageJson = {
		dependencies: {
			'lodash': '^4.0.0',
			'@scope/pkg': '1.0.0'
		},
		peerDependencies: {
			react: '^18.0.0'
		}
	};

	it('should handle dependencies and file types correctly', () => {
		const isExternal = createRollupExternalConfig(mockPackageJson, {
			fileTypesAsExternal: ['.css', '.svg']
		});

		// Dependencies and peer dependencies
		expect(isExternal('lodash')).toBe(true);
		expect(isExternal('@scope/pkg')).toBe(true);
		expect(isExternal('react')).toBe(true);
		expect(isExternal('not-a-dep')).toBe(false);

		// File types
		expect(isExternal('styles.css')).toBe(true);
		expect(isExternal('./src/assets/icon.svg')).toBe(true);
		expect(isExternal('index.js')).toBe(false);
	});

	it('should handle disabled options', () => {
		const isExternal = createRollupExternalConfig(mockPackageJson, {
			pkgJsonDepsAsExternal: false,
			fileTypesAsExternal: []
		});

		expect(isExternal('lodash')).toBe(false);
		expect(isExternal('styles.css')).toBe(false);
	});

	it('should handle case-insensitive file extensions', () => {
		const isExternal = createRollupExternalConfig(mockPackageJson, {
			fileTypesAsExternal: ['.CSS']
		});

		expect(isExternal('styles.css')).toBe(true);
		expect(isExternal('styles.CSS')).toBe(true);
	});
});
