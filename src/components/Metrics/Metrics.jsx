import { useMemo, useState } from 'react';
import {
    Box,
    Checkbox,
    IconButton,
    Menu,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Typography,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getConceptsWithMetrics, getMetrics } from 'mm-modules';
import { evenRowCellStyle, oddRowCellStyle, topHeaderCellStyle } from '../../constants/styles';

const TYPE_FILTERS = ['driver', 'receiver', 'ordinary'];

const STAT_TILES = [
    { key: 'numNodes', label: 'Total Components' },
    { key: 'numRelationships', label: 'Total Connections' },
    { key: 'density', label: 'Density' },
    { key: 'relationshipsPerNode', label: 'Connections per Component' },
    { key: 'numDrivers', label: 'Number of Driver Components' },
    { key: 'numReceivers', label: 'Number of Receiver Components' },
    { key: 'numOrdinary', label: 'Number of Ordinary Components' },
    { key: 'complexity', label: 'Complexity Score' },
];

const COLUMNS = [
    { key: 'name', label: 'Component' },
    { key: 'indegree', label: 'Indegree' },
    { key: 'outdegree', label: 'Outdegree' },
    { key: 'centrality', label: 'Centrality' },
    { key: 'preferredState', label: 'Preferred State' },
];

const formatStat = (value) => (typeof value === 'number' ? Math.round(value * 100) / 100 : value);

export const Metrics = () => {
    const { selectedModel } = useSelector((state) => state.models) || {};
    const { concepts = [] } = selectedModel || {};
    const dispatch = useDispatch();

    const [sortOn, setSortOn] = useState('');
    const [sortDirection, setSortDirection] = useState('desc');
    const [typeFilter, setTypeFilter] = useState(TYPE_FILTERS);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);

    const metrics = useMemo(() => getMetrics({ concepts }), [concepts]);
    const conceptsWithMetrics = useMemo(() => getConceptsWithMetrics({ concepts }), [concepts]);

    const rows = useMemo(() => {
        const filtered =
            typeFilter.length === TYPE_FILTERS.length
                ? conceptsWithMetrics
                : conceptsWithMetrics.filter((concept) => typeFilter.includes(concept.type));
        if (!sortOn) {
            return filtered;
        }
        const sorted = [...filtered].sort((a, b) => {
            const valueA = a[sortOn] ?? 0;
            const valueB = b[sortOn] ?? 0;
            if (valueA === valueB) {
                return 0;
            }
            return valueA > valueB ? 1 : -1;
        });
        if (sortDirection === 'desc') {
            sorted.reverse();
        }
        return sorted;
    }, [conceptsWithMetrics, typeFilter, sortOn, sortDirection]);

    const onSort = (key) => {
        if (sortOn === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortOn(key);
            setSortDirection('desc');
        }
    };

    const onToggleTypeFilter = (type) => {
        setTypeFilter((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
    };

    const onPreferredStateChange = (conceptId, value) => {
        dispatch({
            type: 'models/setPreferredState',
            payload: { conceptId, value },
        });
    };

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '16rem 1fr', height: '100%', overflow: 'hidden' }}>
            <Box sx={{ padding: 2, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {STAT_TILES.map(({ key, label }) => (
                    <Box key={key} sx={{ border: '1px solid', borderColor: 'bg.light' }}>
                        <Typography
                            variant="caption"
                            sx={{ display: 'block', padding: 1, backgroundColor: 'bg.lightest' }}
                        >
                            {label}
                        </Typography>
                        <Typography variant="body1" sx={{ padding: 1 }}>
                            {formatStat(metrics[key])}
                        </Typography>
                    </Box>
                ))}
            </Box>
            <TableContainer sx={{ overflow: 'auto' }}>
                <Table size="small" stickyHeader aria-label="Concept metrics table">
                    <TableHead>
                        <TableRow>
                            {COLUMNS.map(({ key, label }) => (
                                <TableCell key={key} sx={topHeaderCellStyle}>
                                    <TableSortLabel
                                        active={sortOn === key}
                                        direction={sortOn === key ? sortDirection : 'desc'}
                                        onClick={() => onSort(key)}
                                    >
                                        {label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                            <TableCell sx={topHeaderCellStyle}>
                                Type
                                <IconButton
                                    size="small"
                                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                                    aria-label="Filter by type"
                                >
                                    <FilterList fontSize="small" />
                                </IconButton>
                                <Menu
                                    anchorEl={filterAnchorEl}
                                    open={!!filterAnchorEl}
                                    onClose={() => setFilterAnchorEl(null)}
                                >
                                    {TYPE_FILTERS.map((type) => (
                                        <MenuItem key={type} onClick={() => onToggleTypeFilter(type)} dense>
                                            <Checkbox checked={typeFilter.includes(type)} size="small" />
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((concept, i) => {
                            const cellStyle = i % 2 === 0 ? oddRowCellStyle : evenRowCellStyle;
                            return (
                                <TableRow key={concept.id}>
                                    <TableCell sx={cellStyle}>{concept.name}</TableCell>
                                    <TableCell sx={cellStyle} align="center">
                                        {formatStat(concept.indegree)}
                                    </TableCell>
                                    <TableCell sx={cellStyle} align="center">
                                        {formatStat(concept.outdegree)}
                                    </TableCell>
                                    <TableCell sx={cellStyle} align="center">
                                        {formatStat(concept.centrality)}
                                    </TableCell>
                                    <TableCell sx={cellStyle}>
                                        <Select
                                            size="small"
                                            value={concept.preferredState ?? 0}
                                            onChange={(e) => onPreferredStateChange(concept.id, Number(e.target.value))}
                                            fullWidth
                                        >
                                            <MenuItem value={1}>Increase</MenuItem>
                                            <MenuItem value={0}>—</MenuItem>
                                            <MenuItem value={-1}>Decrease</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell sx={cellStyle}>{concept.type}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
