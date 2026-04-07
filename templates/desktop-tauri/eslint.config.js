import tanstack from '@blgc/config/eslint/tanstack';
import { globalIgnores } from 'eslint/config';

/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
export default [...tanstack, globalIgnores(['src-tauri/'], 'Ignore Tauri Rust files')];
