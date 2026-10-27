import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SCENARIO_SETTINGS } from 'mm-modules';
import { ScenarioSettings } from './ScenarioSettings';

const renderSettings = (settings = {}, onChange = vi.fn()) => {
    const utils = render(
        <ScenarioSettings settings={{ ...DEFAULT_SCENARIO_SETTINGS, ...settings }} onChange={onChange} />,
    );
    return { onChange, ...utils };
};

const commit = (label, value) => {
    const input = screen.getByLabelText(label);
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
};

describe('ScenarioSettings rule', () => {
    it('shows the three rules with the current one pressed, and only its description', () => {
        renderSettings({ rule: 'modified kosko' });
        expect(screen.getByRole('button', { name: 'Kosko' }).getAttribute('aria-pressed')).toBe('false');
        expect(screen.getByRole('button', { name: 'Modified Kosko' }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: 'Rescaled Kosko' }).getAttribute('aria-pressed')).toBe('false');
        expect(screen.queryByText(/also keeps its own previous value/)).not.toBeNull();
        expect(screen.queryByText(/only from the concepts that point at it/)).toBeNull();
    });

    it('reports a newly chosen rule once, and nothing for the one already chosen', () => {
        const { onChange } = renderSettings({ rule: 'kosko' });
        fireEvent.click(screen.getByRole('button', { name: 'Kosko' }));
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Modified Kosko' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ rule: 'modified kosko' });
    });
});

describe('ScenarioSettings squash function', () => {
    it('offers all four and reports the chosen one', () => {
        const { onChange } = renderSettings();
        fireEvent.mouseDown(screen.getByLabelText('Squash function'));
        const options = within(screen.getByRole('listbox')).getAllByRole('option');
        expect(options.map((option) => option.textContent)).toEqual([
            'Sigmoid',
            'Hyperbolic Tangent',
            'Bivalent (0 / 1)',
            'Trivalent (-1 / 0 / 1)',
        ]);
        fireEvent.click(options[2]);
        expect(onChange).toHaveBeenCalledWith({ squash: 'bivalent' });
    });

    it.each(['sigmoid', 'hyperbolic tangent'])('shows lambda for %s', (squash) => {
        renderSettings({ squash, lambda: 2 });
        expect(Number(screen.getByLabelText('Lambda').value)).toBe(2);
    });

    it.each(['bivalent', 'trivalent'])('hides lambda for %s', (squash) => {
        renderSettings({ squash });
        expect(screen.queryByLabelText('Lambda')).toBeNull();
    });
});

describe('ScenarioSettings numbers', () => {
    it('reports a valid lambda and threshold', () => {
        const { onChange } = renderSettings();
        commit('Lambda', '2.5');
        expect(onChange).toHaveBeenLastCalledWith({ lambda: 2.5 });
        commit('Noise threshold', '0.15');
        expect(onChange).toHaveBeenLastCalledWith({ noiseThreshold: 0.15 });
    });

    it('never reports a blank entry, and puts the stored value back', () => {
        const { onChange } = renderSettings({ lambda: 3, noiseThreshold: 0.2 });
        commit('Lambda', '');
        commit('Noise threshold', '');
        expect(onChange).not.toHaveBeenCalled();
        expect(Number(screen.getByLabelText('Lambda').value)).toBe(3);
        expect(Number(screen.getByLabelText('Noise threshold').value)).toBe(0.2);
    });

    it('brings an out-of-range entry back into range instead of reporting it as typed', () => {
        const { onChange } = renderSettings({ lambda: 3, noiseThreshold: 0.2 });
        commit('Lambda', '11');
        expect(onChange).toHaveBeenLastCalledWith({ lambda: 10 });
        commit('Lambda', '0');
        expect(onChange).toHaveBeenLastCalledWith({ lambda: 0.1 });
        commit('Noise threshold', '2');
        expect(onChange).toHaveBeenLastCalledWith({ noiseThreshold: 1 });
        commit('Noise threshold', '-1');
        expect(onChange).toHaveBeenLastCalledWith({ noiseThreshold: 0 });
        onChange.mock.calls.forEach(([partial]) => {
            const { lambda = 1, noiseThreshold = 0 } = partial;
            expect(lambda > 0 && lambda <= 10).toBe(true);
            expect(noiseThreshold >= 0 && noiseThreshold <= 1).toBe(true);
        });
    });
});
