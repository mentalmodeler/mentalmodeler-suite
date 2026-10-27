import { Box, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { INFERENCE_RULES, SQUASH_FUNCTIONS } from 'mm-modules';
import { NormalizedNumberInput } from '../NormalizedNumberInput/NormalizedNumberInput';

const RULES = {
    kosko: {
        label: 'Kosko',
        description: 'Each concept is recomputed only from the concepts that point at it.',
    },
    'modified kosko': {
        label: 'Modified Kosko',
        description: 'Like Kosko, but each concept also keeps its own previous value.',
    },
    'rescaled kosko': {
        label: 'Rescaled Kosko',
        description:
            'Like Modified Kosko, but states are first rescaled from 0 to 1 onto -1 to +1, so a concept at rest counts as neutral.',
    },
};

const SQUASH_LABELS = {
    sigmoid: 'Sigmoid',
    'hyperbolic tangent': 'Hyperbolic Tangent',
    bivalent: 'Bivalent (0 / 1)',
    trivalent: 'Trivalent (-1 / 0 / 1)',
};

// Bivalent and trivalent are step functions: lambda (their steepness) does nothing to them.
const USES_LAMBDA = ['sigmoid', 'hyperbolic tangent'];

const numberInputStyle = {
    width: 64,
    padding: '6px 8px',
    border: '1px solid',
    borderColor: 'rgba(0, 0, 0, 0.23)',
    borderRadius: 1,
    font: 'inherit',
    textAlign: 'center',
};

const NumberField = ({ label, value, min, max, step, onCommit }) => (
    <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" component="span">
            {label}
        </Typography>
        {/* A blank entry resolves to the value already stored, so it commits nothing; anything typed
            outside min..max is brought back into range by the input itself on blur. */}
        <NormalizedNumberInput
            value={value}
            emptyValue={value}
            min={min}
            max={max}
            step={step}
            onCommit={onCommit}
            sx={numberInputStyle}
        />
    </Box>
);

// Controlled and presentational: `settings` is always a complete, valid settings object and
// `onChange` receives only the field(s) that changed.
export const ScenarioSettings = ({ settings, onChange }) => {
    const { rule, squash, lambda, noiseThreshold } = settings;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={rule}
                    aria-label="Inference rule"
                    onChange={(_, chosen) => {
                        if (chosen && chosen !== rule) {
                            onChange({ rule: chosen });
                        }
                    }}
                >
                    {INFERENCE_RULES.map((value) => (
                        <ToggleButton key={value} value={value} sx={{ textTransform: 'none' }}>
                            {RULES[value].label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary">
                    {RULES[rule]?.description}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    select
                    size="small"
                    label="Squash function"
                    value={squash}
                    onChange={(e) => onChange({ squash: e.target.value })}
                    sx={{ minWidth: 200 }}
                >
                    {SQUASH_FUNCTIONS.map((value) => (
                        <MenuItem key={value} value={value}>
                            {SQUASH_LABELS[value]}
                        </MenuItem>
                    ))}
                </TextField>
                {USES_LAMBDA.includes(squash) && (
                    <NumberField
                        label="Lambda"
                        value={lambda}
                        min={0.1}
                        max={10}
                        step={0.1}
                        onCommit={(value) => onChange({ lambda: value })}
                    />
                )}
                <NumberField
                    label="Noise threshold"
                    value={noiseThreshold}
                    min={0}
                    max={1}
                    step={0.01}
                    onCommit={(value) => onChange({ noiseThreshold: value })}
                />
            </Box>
        </Box>
    );
};
