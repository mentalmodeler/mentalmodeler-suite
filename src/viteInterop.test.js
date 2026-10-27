import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

// Vite 8 treats every file in this package as Node-style ESM ("type": "module"), so a default import
// of a Babel-compiled CommonJS module (`exports.default = ...`, `__esModule`) gets the whole
// `module.exports` object, not its default export. Vitest unwraps those itself, so unit tests never
// see the problem: it only shows in a real Vite build or dev server (blank page, or a render crash).
// These tests go through a real build, and guard the import styles that trigger it.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const bundle = async (entry) => {
    const output = await build({
        root,
        logLevel: 'silent',
        build: { write: false, minify: false, lib: { entry: path.join(root, entry), formats: ['cjs'] } },
    });
    return [output].flat()[0].output[0].code;
};

describe('Vite build interop', () => {
    it('bundles the store so redux-persist gets a working session storage', async () => {
        const code = await bundle('src/redux/data/store.js');
        const module = { exports: {} };
        // Evaluating the bundle runs persistStore(), which throws if the storage is the wrong object.
        new Function('module', 'exports', code)(module, module.exports);
        expect(typeof module.exports.default.getState).toBe('function');
    }, 60000);

    const sourceFiles = (dir) =>
        readdirSync(dir).flatMap((name) => {
            const file = path.join(dir, name);
            if (statSync(file).isDirectory()) {
                return sourceFiles(file);
            }
            return /\.(js|jsx)$/.test(name) && !/\.test\./.test(name) ? [file] : [];
        });

    it('default-imports no Babel-compiled CommonJS package that Vite 8 would hand back as a module object', () => {
        const offenders = sourceFiles(path.join(root, 'src')).flatMap((file) =>
            readFileSync(file, 'utf8')
                .split('\n')
                // e.g. `import Icon from '@mui/icons-material/ArrowDropDown'` or `from 'redux-persist/lib/...'`
                .filter((line) =>
                    /^import\s+\w+\s+from\s+'(@mui\/icons-material\/[A-Za-z]|redux-persist\/lib\/)/.test(line),
                )
                .map((line) => `${path.relative(root, file)}: ${line.trim()}`),
        );
        expect(offenders).toEqual([]);
    });
});
