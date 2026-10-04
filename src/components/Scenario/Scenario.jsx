import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Checkbox,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { evenRowCellStyle, oddRowCellStyle, topHeaderCellStyle } from '../../constants/styles';
import { getPredictionScore, getScenarioOverride } from '../../utils/scenario';
import { runScenarioCalculation } from '../../services/scenarioEngine';

const SQUASH_FUNCTIONS = [
    { value: 'sigmoid', label: 'Sigmoid' },
    { value: 'hyperbolic tangent', label: 'Hyperbolic Tangent' },
];

export const Scenario = () => {
    const dispatch = useDispatch();
    const { selectedModel, selectedScenario, selectedScenarioId } = useSelector((state) => state.models) || {};
    const { concepts = [] } = selectedModel || {};
    const [squashFunction, setSquashFunction] = useState('sigmoid');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedScenario) {
            setResults([]);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        runScenarioCalculation({ model: selectedModel, scenario: selectedScenario, squashFunction }).then(
            ({ results: newResults }) => {
                if (!cancelled) {
                    setResults(newResults);
                    setLoading(false);
                }
            },
        );
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [concepts, selectedScenario, squashFunction]);

    const resultById = useMemo(() => new Map(results.map(({ id, influence }) => [id, influence])), [results]);

    const prediction = useMemo(
        () => getPredictionScore(concepts, selectedScenario, results),
        [concepts, selectedScenario, results],
    );

    const onNameChange = (e) => {
        dispatch({ type: 'models/updateScenarioName', payload: { name: e.target.value } });
    };

    const onOverrideChange = (conceptId, field, value) => {
        const current = getScenarioOverride(selectedScenario, conceptId);
        dispatch({
            type: 'models/setScenarioConceptOverride',
            payload: { conceptId, ...current, [field]: value },
        });
    };

    if (!selectedScenario) {
        return (
            <Box sx={{ padding: 2 }}>
                <Typography variant="body2">Select a scenario from the sidebar to get started.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 2, height: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    key={selectedScenarioId}
                    label="Scenario name"
                    placeholder="Scenario Name"
                    defaultValue={selectedScenario.name === 'New Scenario' ? '' : selectedScenario.name}
                    onBlur={onNameChange}
                    sx={{ minWidth: 240 }}
                />
                <Select size="small" value={squashFunction} onChange={(e) => setSquashFunction(e.target.value)}>
                    {SQUASH_FUNCTIONS.map(({ value, label }) => (
                        <MenuItem key={value} value={value}>
                            {label}
                        </MenuItem>
                    ))}
                </Select>
                <Typography variant="body2">
                    State Prediction: {loading ? '…' : Number.isNaN(prediction) ? '' : `${prediction}%`}
                </Typography>
            </Box>
            <TableContainer sx={{ overflow: 'auto', flex: 1 }}>
                <Table size="small" stickyHeader aria-label="Scenario concept table">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={topHeaderCellStyle} />
                            <TableCell sx={topHeaderCellStyle}>Component</TableCell>
                            <TableCell sx={topHeaderCellStyle}>+/-</TableCell>
                            <TableCell sx={topHeaderCellStyle}>Preferred State</TableCell>
                            <TableCell sx={topHeaderCellStyle}>Actual State</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {concepts.map((concept, i) => {
                            const cellStyle = i % 2 === 0 ? oddRowCellStyle : evenRowCellStyle;
                            const { selected, influence } = getScenarioOverride(selectedScenario, concept.id);
                            const isClamped = !!influence;
                            const preferredState = parseFloat(concept.preferredState || 0);
                            const actualState = resultById.get(concept.id) || 0;
                            return (
                                <TableRow key={concept.id}>
                                    <TableCell sx={cellStyle}>
                                        <Checkbox
                                            checked={selected}
                                            size="small"
                                            onChange={(e) => onOverrideChange(concept.id, 'selected', e.target.checked)}
                                        />
                                    </TableCell>
                                    <TableCell sx={cellStyle}>{concept.name}</TableCell>
                                    <TableCell sx={cellStyle}>
                                        <Box
                                            key={selectedScenarioId}
                                            component="input"
                                            type="number"
                                            min="-1"
                                            max="1"
                                            step="0.01"
                                            defaultValue={influence || ''}
                                            onBlur={(e) =>
                                                onOverrideChange(
                                                    concept.id,
                                                    'influence',
                                                    parseFloat(e.target.value) || 0,
                                                )
                                            }
                                            sx={{ width: '100%' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={cellStyle}>
                                        {!isClamped && preferredState !== 0
                                            ? preferredState > 0
                                                ? 'Increase'
                                                : 'Decrease'
                                            : ''}
                                    </TableCell>
                                    <TableCell sx={cellStyle}>
                                        {!isClamped && actualState !== 0
                                            ? actualState > 0
                                                ? 'Increase'
                                                : 'Decrease'
                                            : ''}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
