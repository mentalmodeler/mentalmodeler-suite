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

const openSlider = (input) => fireEvent.mouseDown(input);
// ClickAwayListener starts listening one timeout after mount, so give it that tick before clicking away.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const sliderRoot = () => document.querySelector('.MuiSlider-root');
// MUI recomputes the value from the mouseup's position, so the release must carry the same clientX.
const releaseAt = (fraction) => fireEvent.mouseUp(document, { clientX: fraction * 100 });
const dragTo = (fraction, { release = true } = {}) => {
    const root = sliderRoot();
    root.getBoundingClientRect = () => ({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 10,
        height: 10,
        x: 0,
        y: 0,
    });
    fireEvent.mouseDown(root, { clientX: fraction * 100, buttons: 1 });
    if (release) {
        releaseAt(fraction);
    }
};

describe('NormalizedNumberInput slider', () => {
    it('renders the bare input and no slider unless showSlider is set', () => {
        const { input } = setup({ value: 0.5 });
        openSlider(input);
        expect(sliderRoot()).toBeNull();
        // RTL renders into a container div; with no slider the input is its direct child (no wrapper).
        expect(input.parentElement).toBe(document.body.firstElementChild);
    });

    it('does not open on focus, only on mouse down', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        fireEvent.focus(input);
        expect(sliderRoot()).toBeNull();
        openSlider(input);
        expect(sliderRoot()).not.toBeNull();
    });

    it('shows the cell value on the slider, and 0 for a blank cell', () => {
        const { input } = setup({ value: '', emptyValue: '', showSlider: true });
        openSlider(input);
        expect(document.querySelector('input[type="range"]').value).toBe('0');
    });

    it('shows the dragged value in the text input before the mouse is released', () => {
        // The text box is how the user sees what value the slider is setting, so it must track the drag.
        const { onCommit, input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        dragTo(0.7, { release: false });
        expect(input.value).toBe('0.4');
        expect(onCommit).not.toHaveBeenCalled();
        releaseAt(0.7);
        expect(onCommit).toHaveBeenCalledWith(0.4);
    });

    it('rounds the dragged value to 2 decimals so the text never shows float noise', () => {
        const { input } = setup({ value: 0, showSlider: true });
        openSlider(input);
        dragTo(0.65, { release: false }); // 0.3 would be 0.30000000000000004 unrounded
        expect(input.value).toBe('0.3');
        releaseAt(0.65);
    });

    it('reverts the preview when the release ends where the cell was', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        dragTo(0.7, { release: false });
        expect(input.value).toBe('0.4');
        dragTo(0.75, { release: true }); // back to 0.5, the original value
        expect(input.value).toBe('0.5');
    });

    it('updates the text while dragging and commits once on release', () => {
        const { onCommit, input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        dragTo(0.7);
        expect(input.value).toBe('0.4');
        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(onCommit).toHaveBeenCalledWith(0.4);
    });

    it('commits nothing when the release ends where the cell already was', () => {
        const { onCommit, input } = setup({ value: '', emptyValue: '', showSlider: true });
        openSlider(input);
        dragTo(0.5); // value 0 == a blank cell shown as 0
        expect(onCommit).not.toHaveBeenCalled();
        expect(input.value).toBe('');
    });

    it('closes on a mouse down outside and on Escape', async () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        await tick();
        openSlider(input);
        expect(sliderRoot()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        expect(sliderRoot()).toBeNull();
        openSlider(input);
        expect(sliderRoot()).not.toBeNull();
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(sliderRoot()).toBeNull();
    });

    it('opens only one slider at a time', async () => {
        const onCommit = vi.fn();
        render(
            <>
                <NormalizedNumberInput id="one" value={0.1} onCommit={onCommit} showSlider />
                <NormalizedNumberInput id="two" value={0.2} onCommit={onCommit} showSlider />
            </>,
        );
        await tick();
        fireEvent.mouseDown(document.getElementById('one'));
        fireEvent.mouseDown(document.getElementById('two'));
        expect(document.querySelectorAll('.MuiSlider-root')).toHaveLength(1);
    });

    it('is hidden from assistive tech and not a tab stop', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        const root = sliderRoot();
        expect(root.closest('[aria-hidden="true"]')).not.toBeNull();
        expect(document.querySelector('input[type="range"]').getAttribute('tabindex')).toBe('-1');
        expect(document.querySelector('[data-testid="ArrowDropDownIcon"]').getAttribute('aria-hidden')).toBe('true');
    });
});

describe('NormalizedNumberInput slider thumb and focus', () => {
    const stubTrack = () => {
        sliderRoot().getBoundingClientRect = () => ({
            left: 0,
            right: 100,
            width: 100,
            top: 0,
            bottom: 10,
            height: 10,
            x: 0,
            y: 0,
        });
    };
    const thumb = () => document.querySelector('.MuiSlider-thumb');

    it('commits nothing when the thumb is clicked off-centre without moving', () => {
        // MUI jumps to the pointer position even on the thumb, so a plain click would nudge the value.
        const { onCommit, input } = setup({ value: '', emptyValue: '', showSlider: true });
        openSlider(input);
        stubTrack();
        fireEvent.mouseDown(thumb(), { clientX: 52, buttons: 1 });
        fireEvent.mouseUp(document, { clientX: 52 });
        expect(onCommit).not.toHaveBeenCalled();
        expect(input.value).toBe('');
    });

    it('does not round a stored value when its thumb is clicked', () => {
        const { onCommit, input } = setup({ value: 0.333, showSlider: true });
        openSlider(input);
        stubTrack();
        fireEvent.mouseDown(thumb(), { clientX: 67, buttons: 1 });
        fireEvent.mouseUp(document, { clientX: 67 });
        expect(onCommit).not.toHaveBeenCalled();
        expect(input.value).toBe('0.333');
    });

    it('drags from the thumb: text follows the move and one commit on release', () => {
        const { onCommit, input } = setup({ value: '', emptyValue: '', showSlider: true });
        openSlider(input);
        stubTrack();
        fireEvent.mouseDown(thumb(), { clientX: 52, buttons: 1 });
        fireEvent.mouseMove(document, { clientX: 70, buttons: 1 });
        expect(input.value).toBe('0.4');
        fireEvent.mouseUp(document, { clientX: 70 });
        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(onCommit).toHaveBeenCalledWith(0.4);
    });

    it('keeps focus in the text input, not the hidden slider, after a drag', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        dragTo(0.7);
        expect(document.activeElement).toBe(input);
    });

    it('commits once, and not the half-typed draft separately, when a drag follows typing', () => {
        const { onCommit, input } = setup({ value: 0.5, showSlider: true });
        input.focus();
        openSlider(input);
        fireEvent.change(input, { target: { value: '0.7' } });
        dragTo(0.25); // -0.5
        expect(onCommit.mock.calls).toEqual([[-0.5]]);
    });

    it('keeps a half-typed draft when the thumb is clicked without moving', () => {
        const { onCommit, input } = setup({ value: 0.5, showSlider: true });
        input.focus();
        openSlider(input);
        fireEvent.change(input, { target: { value: '0.7' } });
        stubTrack();
        fireEvent.mouseDown(thumb(), { clientX: 75, buttons: 1 });
        fireEvent.mouseUp(document, { clientX: 75 });
        expect(input.value).toBe('0.7');
        expect(onCommit).not.toHaveBeenCalled();
    });
});

describe('NormalizedNumberInput slider placement', () => {
    it('closes when the page or a scroll container scrolls, so it never floats away from its cell', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        expect(sliderRoot()).not.toBeNull();
        fireEvent.scroll(document.body);
        expect(sliderRoot()).toBeNull();
    });

    it('stays open when the slider itself is scrolled or touched', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        fireEvent.scroll(sliderRoot());
        expect(sliderRoot()).not.toBeNull();
    });

    it('sits above the matrix sticky headers but below the app bar and dialogs', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        const { zIndex } = window.getComputedStyle(document.querySelector('[role="tooltip"]'));
        expect(Number(zIndex)).toBeGreaterThan(4);
        expect(Number(zIndex)).toBeLessThan(1100);
    });
});
