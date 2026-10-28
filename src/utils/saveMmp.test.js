import { describe, expect, it, vi } from 'vitest';
import { parseMMP } from 'mm-modules';
import {
    formatTimestamp,
    modelNameFromFile,
    saveFilename,
    stripExtension,
    stripTimestamp,
    toSaveModel,
} from './saveMmp';

describe('stripExtension', () => {
    it.each([
        ['fire_model.mmp', 'fire_model'],
        ['fire_model.v2.mmp', 'fire_model.v2'],
        ['model.final.copy.csv', 'model.final.copy'],
        ['no_extension', 'no_extension'],
        ['.mmp', '.mmp'],
    ])('%s -> %s', (input, expected) => {
        expect(stripExtension(input)).toBe(expected);
    });
});

describe('stripTimestamp', () => {
    it.each([
        ['fire_model_2026-10-27_1634', 'fire_model'],
        ['fire_model', 'fire_model'],
        ['report_2024', 'report_2024'],
        ['trial_2026-10-27_1634_final', 'trial_2026-10-27_1634_final'],
        ['fire_model_2026-10-27_1634_2026-10-28_0900', 'fire_model_2026-10-27_1634'],
        ['_2026-10-27_1634', '_2026-10-27_1634'],
    ])('%s -> %s', (input, expected) => {
        expect(stripTimestamp(input)).toBe(expected);
    });
});

describe('modelNameFromFile', () => {
    it('drops the extension and a trailing save stamp, and nothing else', () => {
        expect(modelNameFromFile('fire_model_2026-10-27_1634.mmp')).toBe('fire_model');
        expect(modelNameFromFile('fire_model.v2_2026-10-27_1634.mmp')).toBe('fire_model.v2');
        expect(modelNameFromFile('fire_model.v2.mmp')).toBe('fire_model.v2');
    });
});

describe('formatTimestamp', () => {
    it('is local time as YYYY-MM-DD_HHmm, zero padded', () => {
        expect(formatTimestamp(new Date(2026, 0, 5, 7, 4, 59))).toBe('2026-01-05_0704');
        expect(formatTimestamp(new Date(2026, 9, 27, 16, 34))).toBe('2026-10-27_1634');
    });
});

describe('saveFilename', () => {
    it('is the model filename, the stamp and .mmp', () => {
        expect(saveFilename({ filename: 'fire_model' }, new Date(2026, 9, 27, 16, 34))).toBe(
            'fire_model_2026-10-27_1634.mmp',
        );
    });

    it('falls back to "model" when there is no filename, and stamps from now by default', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 27, 16, 34));
        expect(saveFilename({})).toBe('model_2026-10-27_1634.mmp');
        expect(saveFilename(undefined)).toBe('model_2026-10-27_1634.mmp');
        vi.useRealTimers();
    });
});

describe('toSaveModel', () => {
    const model = {
        appId: 'appId-123',
        filename: 'fire_model',
        info: { id: 'abc', name: 'Fire' },
        groupNames: { 0: '' },
        concepts: [{ id: 'c1', name: 'A', relationships: [] }],
        scenarios: [
            {
                name: 'Hot',
                concepts: [{ id: 'c1', selected: true, influence: 1 }],
                settings: { rule: 'rescaled kosko', squash: 'trivalent', lambda: 2.5, noiseThreshold: 0.15 },
            },
            { name: 'Plain', concepts: [] },
        ],
    };

    it('leaves out the runtime-only appId and filename, so loading takes the file name instead', () => {
        const saved = toSaveModel(model);
        expect(saved).not.toHaveProperty('appId');
        expect(saved).not.toHaveProperty('filename');
        expect(model.appId).toBe('appId-123');
    });

    it('does not write the compare-ref marker', () => {
        expect(toSaveModel(model)).not.toHaveProperty('compareRef');
    });

    it('round-trips through the loader with every scenario and its settings intact', () => {
        const loaded = parseMMP(JSON.stringify(toSaveModel(model)));
        expect(loaded).toEqual(toSaveModel(model));
        expect(loaded.scenarios[0].settings).toEqual(model.scenarios[0].settings);
        expect(loaded.scenarios[1]).not.toHaveProperty('settings');
    });
});
