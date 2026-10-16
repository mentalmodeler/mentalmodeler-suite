import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NormalizedNumberInput } from './NormalizedNumberInput';

const setup = (props) => {
    const onCommit = vi.fn();
    render(<NormalizedNumberInput onCommit={onCommit} {...props} />);
    return { onCommit, input: document.querySelector('input[type="number"]') };
};

describe('NormalizedNumberInput commit-on-blur', () => {
    it('does not commit when focus leaves a cell that was not edited', () => {
        const { onCommit, input } = setup({ value: 0.34 });
        fireEvent.focus(input);
        fireEvent.blur(input);
        expect(onCommit).not.toHaveBeenCalled();
    });

    it('does not commit when a blank cell is left blank', () => {
        const { onCommit, input } = setup({ value: '', emptyValue: '' });
        fireEvent.blur(input);
        expect(onCommit).not.toHaveBeenCalled();
    });

    it('does not commit a string value that equals the current number', () => {
        // .mmp influences are strings: "0.5" is the same value as 0.5
        const { onCommit, input } = setup({ value: '0.5' });
        fireEvent.blur(input);
        expect(onCommit).not.toHaveBeenCalled();
    });

    it('commits a changed value, clamped', () => {
        const { onCommit, input } = setup({ value: 0.2 });
        fireEvent.change(input, { target: { value: '5' } });
        fireEvent.blur(input);
        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(onCommit).toHaveBeenCalledWith(1);
    });

    it('still snaps an out-of-range draft back into range when nothing is committed', () => {
        const { onCommit, input } = setup({ value: 1 });
        fireEvent.change(input, { target: { value: '5' } });
        fireEvent.blur(input);
        expect(onCommit).not.toHaveBeenCalled();
        expect(input.value).toBe('1');
    });
});
