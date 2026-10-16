import { useEffect, useRef, useState } from 'react';
import { Box, ClickAwayListener, Paper, Popper, Slider } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { normalize } from '../../utils/utils';

// The value the cell currently holds, as a number (or emptyValue when blank), so "0.5" and 0.5 compare equal.
const toCurrent = (value, emptyValue) => {
    if (value === '' || value == null) {
        return emptyValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? emptyValue : parsed;
};

// Controlled by local state, not the value prop directly: typing updates local
// state on every keystroke (cheap, no parent dispatch), and only on blur does
// the normalized value get committed via onCommit - mirrors mentalmodeler-js's
// own RelationshipValueDisplay.js (tempInfluenceTextValue pattern). Resyncs
// from value via useEffect so switching models/scenarios (without unmounting
// this input) still shows the right value, and so the display always matches
// what was actually committed after a clamp.
//
// With showSlider, a mouse down in the cell opens a decorative slider under it (the old
// mentalmodeler-scenario behavior). The slider is a mouse/touch accelerator only: it is hidden
// from assistive tech and not a tab stop, and the text input stays the accessible control. The text
// follows the drag live; the value is committed once, on release.
export const NormalizedNumberInput = ({
    value,
    onCommit,
    emptyValue = '',
    min = -1,
    max = 1,
    step = 0.01,
    showSlider = false,
    sx,
    ...props
}) => {
    const [draft, setDraft] = useState(value ?? '');
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    const inputRef = useRef(null);
    const paperRef = useRef(null);
    // Set once the slider has really moved (a drag, or a click on the track), as opposed to a click on the thumb.
    const movedRef = useRef(false);
    const grabbedThumbRef = useRef(false);

    useEffect(() => {
        setDraft(value ?? '');
    }, [value]);

    // The slider is portaled to <body>, so it would otherwise stay put (or follow its cell out from under the
    // table's sticky headers and over the page chrome) when the table scrolls. Close it on any scroll, in
    // any scroll container (scroll doesn't bubble, hence capture), except one inside the slider itself.
    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const onScroll = (e) => {
            if (!paperRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        window.addEventListener('scroll', onScroll, true);
        return () => window.removeEventListener('scroll', onScroll, true);
    }, [open]);

    const onBlur = (e) => {
        // Focus moving into the slider (MUI focuses its hidden input on mouse down) is not the user leaving the
        // cell: don't commit a half-typed draft separately from the drag.
        if (e?.relatedTarget && paperRef.current?.contains(e.relatedTarget)) {
            return;
        }
        const parsed = parseFloat(draft);
        const committed = isNaN(parsed) ? emptyValue : normalize(parsed, min, max);
        setDraft(committed);
        if (committed !== toCurrent(value, emptyValue)) {
            onCommit(committed);
        }
    };

    const input = (
        <Box
            component="input"
            ref={inputRef}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={onBlur}
            sx={{
                // The native up/down spinner eats most of a narrow cell's
                // width, leaving no room for the digit itself -- drop it.
                MozAppearance: 'textfield',
                '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                },
                ...sx,
            }}
            {...props}
        />
    );

    if (!showSlider) {
        return input;
    }

    const roundTo2 = (n) => Math.round(n * 100) / 100;
    const parsedDraft = parseFloat(draft);
    const sliderValue = isNaN(parsedDraft) ? 0 : normalize(parsedDraft, min, max);

    // A release that ends where the cell already was (a click on the thumb) must not write anything --
    // in particular it must not turn a blank matrix cell into a 0-influence connection.
    const onSliderChange = (event, v) => {
        // MUI jumps to the pointer position on mouse down, even on the thumb, so a plain click on the thumb
        // would nudge the value. Ignore that jump; moves and clicks on the track still count. (MUI replaces the
        // event's target, so whether the thumb was grabbed is recorded in onMouseDownCapture below.)
        if (event.type === 'mousedown' && grabbedThumbRef.current) {
            return;
        }
        movedRef.current = true;
        setDraft(roundTo2(v));
    };

    const onSliderCommit = (_, newValue) => {
        if (!movedRef.current) {
            return;
        }
        movedRef.current = false;
        const v = roundTo2(newValue);
        const current = toCurrent(value, emptyValue);
        const where = current === '' ? 0 : current; // a blank cell is shown as 0 on the slider
        if (v === where) {
            setDraft(value ?? '');
            return;
        }
        setDraft(v);
        onCommit(v);
    };

    return (
        <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={() => setOpen(false)}>
            <Box
                ref={anchorRef}
                onMouseDown={() => setOpen(true)}
                onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
                sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}
            >
                {input}
                <ArrowDropDownIcon
                    aria-hidden="true"
                    fontSize="small"
                    sx={{ position: 'absolute', right: 0, color: 'text.secondary' }}
                />
                <Popper
                    open={open}
                    anchorEl={anchorRef.current}
                    placement="bottom-start"
                    // Above the matrix's sticky headers (z 2-4), below the app bar and dialogs.
                    sx={{ zIndex: (theme) => theme.zIndex.appBar - 1 }}
                >
                    <Paper
                        ref={paperRef}
                        aria-hidden="true"
                        elevation={2}
                        // The slider is decorative: MUI focuses its hidden input on mouse down, so hand focus
                        // straight back to the text input (the accessible control).
                        onMouseDownCapture={(e) => {
                            grabbedThumbRef.current = !!e.target.closest?.('.MuiSlider-thumb');
                        }}
                        onFocus={() => inputRef.current?.focus({ preventScroll: true })}
                        sx={{ px: 1.5, py: 0.5, minWidth: 96, width: anchorRef.current?.offsetWidth }}
                    >
                        <Slider
                            size="small"
                            min={min}
                            max={max}
                            step={step}
                            value={sliderValue}
                            tabIndex={-1}
                            onChange={onSliderChange}
                            onChangeCommitted={onSliderCommit}
                        />
                    </Paper>
                </Popper>
            </Box>
        </ClickAwayListener>
    );
};
