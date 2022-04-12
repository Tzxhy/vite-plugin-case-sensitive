# vite-plugin-case-sensitive
Detect module import with case sensitive for vite(compatible with rollup).

# usage
```js
// vite.config.js
import caseSensitivePlugin from '@tzxhy/vite-plugin-case-sensitive';
import path from 'path';

export default defineConfig(env => {
	const plugins = [];
	if (env.mode !== 'production') {
        plugins.push(caseSensitivePlugin({
			// the minimum project root, for example: /User/test/workspace/project/src
            cwd: path.join(process.cwd(), 'src'),
        }));
    }
	// ... other configs
	return {
		plugins,
		// ... other configs
	};
});
```
