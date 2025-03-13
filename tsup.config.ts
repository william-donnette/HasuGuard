import {defineConfig} from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs'], // Build for commonJS and ESmodules
	dts: false, // Generate declaration file (.d.ts)
	splitting: false,
	sourcemap: false,
	clean: true,
});
