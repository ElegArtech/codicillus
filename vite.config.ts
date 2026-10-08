import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		// Le schéma et le collage doivent partager les mêmes classes ProseMirror.
		dedupe: ['prosemirror-model']
	},
	server: {
		port: Number(process.env.PORT_DEV ?? 5173),
		watch: { ignored: ['**/.local/**'] }
	}
});
