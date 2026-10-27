import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Checkbox,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useTheme,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { normalizeScenarioSettings } from 'mm-modules';
import {
    evenRowCellStyle,
    getValueCellStyle,
    getValueInputStyle,
    oddRowCellStyle,
    topHeaderCellStyle,
} from '../../constants/styles';
import { getPredictionScore, getScenarioChartData, getScenarioOverride } from '../../utils/scenario';
import { runScenarioCalculation } from '../../services/scenarioEngine';
import { NormalizedNumberInput } from '../NormalizedNumberInput/NormalizedNumberInput';
import { ScenarioChart } from './ScenarioChart';
import { ScenarioSettings } from './ScenarioSettings';

// MUI's default TableCell padding (16px each side) leaves almost nothing for
// content once a column is this narrow -- these columns need the room back.
const narrowCellStyle = { paddingInline: '4px' };

// Rows that aren't driving the scenario (clamped by a value, or unchecked) read as dimmed, like the legacy app.
const DIMMED_OPACITY = 0.65;

export const Scenario = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const { selectedModel, selectedScenario, selectedScenarioId } = useSelector((state) => state.models) || {};
    const { concepts = [] } = selectedModel || {};
    // A scenario saved before settings existed has none: it reads (and runs) as the defaults, and is left as is
    // until the user changes a setting.
    const settings = useMemo(() => normalizeScenarioSettings(selectedScenario?.settings), [selectedScenario]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedScenario || !selectedScenarioId) {
            setResults([]);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        runScenarioCalculation({ model: selectedModel, scenario: selectedScenario })
            .then(({ results: newResults }) => {
                if (!cancelled) {
                    setResults(newResults);
                    setLoading(false);
                }
            })
            .catch((error) => {
                console.error('runScenarioCalculation failed:', error);
                if (!cancelled) {
                    setResults([]);
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [concepts, selectedScenario]);

    const resultById = useMemo(() => new Map(results.map(({ id, influence }) => [id, influence])), [results]);

    const prediction = useMemo(
        () => getPredictionScore(concepts, selectedScenario, results),
        [concepts, selectedScenario, results],
    );

    const chartData = useMemo(
        () => getScenarioChartData(concepts, selectedScenario, results),
        [concepts, selectedScenario, results],
    );

    const onNameChange = (e) => {
        const name = e.target.value.trim();
        if (!name) {
            return;
        }
        dispatch({ type: 'models/updateScenarioName', payload: { name } });
    };

    // A focused number input changes its value on wheel. preventDefault() would stop that but also stops the
    // table scrolling, so leave the input instead: no value change, and the scroll goes through.
    const onTableWheel = (e) => {
        if (document.activeElement === e.target && e.target.type === 'number') {
            e.target.blur();
        }
    };

    const onOverrideChange = (conceptId, field, value) => {
        const current = getScenarioOverride(selectedScenario, conceptId);
        dispatch({
            type: 'models/setScenarioConceptOverride',
            payload: { conceptId, ...current, [field]: value },
        });
    };

    if (!selectedScenario || !selectedScenarioId) {
        return (
            <Box sx={{ padding: 2 }}>
                <Typography variant="body2">Select a scenario from the sidebar to get started.</Typography>
            </Box>
        );
    }

    return (
        <Box
            id="scenarioPanel"
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 2, height: '100%', overflow: 'hidden' }}
        >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    key={selectedScenarioId}
                    label="Scenario name"
                    placeholder="Scenario Name"
                    defaultValue={selectedScenario.name === 'New Scenario' ? '' : selectedScenario.name}
                    onBlur={onNameChange}
                    sx={{ minWidth: 240 }}
                />
                <ScenarioSettings
                    settings={settings}
                    onChange={(changed) =>
                        dispatch({ type: 'models/setScenarioSettings', payload: { settings: changed } })
                    }
                />
                <Typography variant="body2">
                    State Prediction: {loading ? '…' : Number.isNaN(prediction) ? '' : `${prediction}%`}
                </Typography>
            </Box>
            {/* Fixed height regardless of loading state so toggling it doesn't shift the
                table/chart below -- opacity is the only thing that changes. */}
            <LinearProgress sx={{ height: 3, opacity: loading ? 1 : 0, transition: 'opacity 150ms' }} />
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    minHeight: 0,
                    gap: 2,
                    opacity: loading ? 0.6 : 1,
                    transition: 'opacity 150ms',
                }}
            >
                <TableContainer sx={{ overflow: 'auto', flex: '0 0 424px', minWidth: 0, overscrollBehavior: 'none' }}>
                    <Table
                        size="small"
                        stickyHeader
                        aria-label="Scenario concept table"
                        sx={{ tableLayout: 'fixed' }}
                        onWheel={onTableWheel}
                    >
                        <TableHead sx={{ '& .MuiTableCell-head': { verticalAlign: 'bottom' } }}>
                            <TableRow>
                                <TableCell sx={{ ...topHeaderCellStyle, ...narrowCellStyle, width: 36 }} />
                                <TableCell sx={topHeaderCellStyle}>Component</TableCell>
                                <TableCell sx={{ ...topHeaderCellStyle, ...narrowCellStyle, width: 80 }}>+/-</TableCell>
                                <TableCell sx={{ ...topHeaderCellStyle, ...narrowCellStyle, width: 70 }}>
                                    Preferred State
                                </TableCell>
                                <TableCell sx={{ ...topHeaderCellStyle, ...narrowCellStyle, width: 90 }}>
                                    Actual State
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {concepts.map((concept, i) => {
                                const cellStyle = i % 2 === 0 ? oddRowCellStyle : evenRowCellStyle;
                                const { selected, influence } = getScenarioOverride(selectedScenario, concept.id);
                                const isClamped = !!influence;
                                const dimmedStyle = isClamped || !selected ? { opacity: DIMMED_OPACITY } : {};
                                const preferredState = parseFloat(concept.preferredState || 0);
                                const actualState = resultById.get(concept.id) || 0;
                                return (
                                    <TableRow key={concept.id}>
                                        <TableCell sx={{ ...cellStyle, ...narrowCellStyle }}>
                                            {/* A value puts the concept in the scenario for certain: nothing to toggle. */}
                                            {!isClamped && (
                                                <Checkbox
                                                    checked={selected}
                                                    size="small"
                                                    onChange={(e) =>
                                                        onOverrideChange(concept.id, 'selected', e.target.checked)
                                                    }
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ ...cellStyle, ...dimmedStyle, wordBreak: 'break-word' }}>
                                            {concept.name}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                ...cellStyle,
                                                ...getValueCellStyle({
                                                    color: theme.palette.tabs.scenario,
                                                    hasValue: isClamped,
                                                }),
                                            }}
                                        >
                                            {/* Unchecked means out of the scenario: no value to enter until re-checked. */}
                                            {selected && (
                                                <NormalizedNumberInput
                                                    value={influence}
                                                    emptyValue={0}
                                                    showSlider
                                                    onCommit={(val) => onOverrideChange(concept.id, 'influence', val)}
                                                    sx={getValueInputStyle({ color: theme.palette.tabs.scenario })}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                ...cellStyle,
                                                ...narrowCellStyle,
                                                ...dimmedStyle,
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {!isClamped && preferredState !== 0
                                                ? preferredState > 0
                                                    ? 'Increase'
                                                    : 'Decrease'
                                                : ''}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                ...cellStyle,
                                                ...narrowCellStyle,
                                                ...dimmedStyle,
                                                wordBreak: 'break-word',
                                            }}
                                        >
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
                <Box sx={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                    <ScenarioChart data={chartData} />
                </Box>
            </Box>
        </Box>
    );
};
