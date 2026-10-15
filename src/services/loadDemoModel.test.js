import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAndParseURL } from 'mm-modules';
import { loadDemoModel } from './loadDemoModel';

vi.mock('mm-modules', () => ({ loadAndParseURL: vi.fn() }));

beforeEach(() => {
    vi.stubGlobal('alert', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    loadAndParseURL.mockReset();
});

describe('loadDemoModel', () => {
    it('returns the parsed model with a filename taken from the url', async () => {
        loadAndParseURL.mockResolvedValue({ info: { name: 'Fire' }, concepts: [] });
        const model = await loadDemoModel('/models/fire_model.mmp');
        expect(model).toEqual({ info: { name: 'Fire' }, concepts: [], filename: 'fire_model' });
        expect(alert).not.toHaveBeenCalled();
    });

    it('alerts and returns null when the request fails', async () => {
        loadAndParseURL.mockRejectedValue(new DOMException('MMP url loading failed!'));
        await expect(loadDemoModel('/models/missing.mmp')).resolves.toBeNull();
        expect(alert).toHaveBeenCalledTimes(1);
        expect(alert.mock.calls[0][0]).toContain('/models/missing.mmp');
    });

    it('returns null without a second alert when the content could not be parsed', async () => {
        // parseMMP has already alerted by the time it resolves to undefined.
        loadAndParseURL.mockResolvedValue(undefined);
        await expect(loadDemoModel('/models/bad.mmp')).resolves.toBeNull();
        expect(alert).not.toHaveBeenCalled();
    });
});
