import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit()],
	server: {
		hmr: false,
	},
	build: {
		target: 'esnext'
	}
};

export default config;
