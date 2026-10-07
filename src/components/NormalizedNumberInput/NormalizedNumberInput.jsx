import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { normalize } from '../../utils/utils';

// Controlled by local state, not the value prop directly: typing updates local
// state on every keystroke (cheap, no parent dispatch), and only on blur does
// the normalized value get committed via onCommit - mirrors mentalmodeler-js's
// own RelationshipValueDisplay.js (tempInfluenceTextValue pattern). Resyncs
// from value via useEffect so switching models/scenarios (without unmounting
// this input) still shows the right value, and so the display always matches
// what was actually committed after a clamp.
export const NormalizedNumberInput = ({
    value,
    onCommit,
    emptyValue = '',
    min = -1,
    max = 1,
    step = 0.01,
    sx,
    ...props
}) => {
    const [draft, setDraft] = useState(value ?? '');

    useEffect(() => {
        setDraft(value ?? '');
    }, [value]);

    const onBlur = () => {
        const parsed = parseFloat(draft);
        const committed = isNaN(parsed) ? emptyValue : normalize(parsed, min, max);
        setDraft(committed);
        onCommit(committed);
    };

    return (
        <Box
            component="input"
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
};
