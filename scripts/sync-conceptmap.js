#!/usr/bin/env node

// Copies mentalmodeler-js's built concept-map bundle into
// public/libs/conceptmap/, replacing the manual copy-paste-and-rename-the-hash
// process documented in docs/mentalmodeler-js-deploy-and-vendoring.md.
//
// mentalmodeler-js's own build output still has CRA's content hash in the
// filename (static/js/main.<hash>.js, static/css/main.<hash>.css) -- this
// script strips that on the way in, so index.html's <script>/<link> tags
// always point at the same stable main.js/main.css and never need editing
// again after the one-time switch to those stable names.
//
// Usage: npm run sync-conceptmap  (run from mentalmodeler-suite)
// Precondition: mentalmodeler-js's build/ must already exist (npm run build
// there first) -- this script only copies, it doesn't build mentalmodeler-js.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const suiteRoot = path.resolve(__dirname, '..');
const jsBuildDir = path.resolve(suiteRoot, '../mentalmodeler-js/build');
const targetDir = path.join(suiteRoot, 'public/libs/conceptmap');

const die = (message) => {
    console.error(`sync-conceptmap: ${message}`);
    process.exit(1);
};

const relative = (p) => path.relative(suiteRoot, p);

// Finds the single file in dir matching pattern -- errors loudly instead of
// silently picking one if the build output ever has more than one (or none),
// rather than vendoring the wrong file without anyone noticing.
const findOne = (dir, pattern) => {
    if (!fs.existsSync(dir)) {
        die(`expected directory not found: ${dir}\nRun "npm run build" in mentalmodeler-js first.`);
    }
    const matches = fs.readdirSync(dir).filter((name) => pattern.test(name));
    if (matches.length === 0) {
        die(`no file matching ${pattern} in ${dir}`);
    }
    if (matches.length > 1) {
        die(`expected exactly one file matching ${pattern} in ${dir}, found: ${matches.join(', ')}`);
    }
    return path.join(dir, matches[0]);
};

// Copies srcDir's single pattern-matched file to destDir/destName, stripping
// the hash from the name. Carries over a same-named .map sourcemap too, if
// mentalmodeler-js produced one.
const copyStable = (srcDir, pattern, destDir, destName) => {
    const srcFile = findOne(srcDir, pattern);
    fs.mkdirSync(destDir, { recursive: true });
    const destFile = path.join(destDir, destName);
    fs.copyFileSync(srcFile, destFile);
    console.log(`  ${relative(srcFile)} -> ${relative(destFile)}`);

    const mapSrc = `${srcFile}.map`;
    if (fs.existsSync(mapSrc)) {
        fs.copyFileSync(mapSrc, `${destFile}.map`);
    }
};

const copyDirFiles = (srcDir, destDir) => {
    fs.mkdirSync(destDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        if (entry.isFile()) {
            fs.copyFileSync(path.join(srcDir, entry.name), path.join(destDir, entry.name));
        }
    }
    console.log(`  ${relative(srcDir)}/* -> ${relative(destDir)}/*`);
};

if (!fs.existsSync(jsBuildDir)) {
    die(`${jsBuildDir} not found. Run "npm run build" in mentalmodeler-js first.`);
}

console.log('Syncing mentalmodeler-js build into public/libs/conceptmap...');
copyStable(path.join(jsBuildDir, 'static/js'), /^main\..*\.js$/, path.join(targetDir, 'static/js'), 'main.js');
copyStable(path.join(jsBuildDir, 'static/css'), /^main\..*\.css$/, path.join(targetDir, 'static/css'), 'main.css');
copyDirFiles(path.join(jsBuildDir, 'shared'), path.join(targetDir, 'shared'));
console.log('Done.');
