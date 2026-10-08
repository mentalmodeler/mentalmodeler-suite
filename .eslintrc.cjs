module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { react: { version: '18.2' } },
    plugins: ['react-refresh'],
    rules: {
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        "react/prop-types": 0,
    },
    overrides: [
        {
            // Plain Node CLI scripts (sync-conceptmap.js etc.), not part of the
            // browser app -- need Node globals instead of browser ones.
            files: ['scripts/**/*.js'],
            env: { browser: false, node: true, es2020: true },
        },
    ],
};
