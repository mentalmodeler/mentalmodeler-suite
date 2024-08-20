import { Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Box, alpha } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { findRelationship } from '../../utils/utils';
import { useEffect, useRef } from 'react';
import { useTheme } from '@emotion/react';
import { evenRowCellStyle, oddRowCellStyle, sideHeaderCellStyle, topHeaderCellStyle } from '../../constants/styles';

export const Matrix = () => {
    const { selectedModel } = useSelector((state) => state.models) || {};
    const { concepts = [] } = selectedModel || {};
    const dispatch = useDispatch();
    const theme = useTheme();
    const tableRef = useRef(null);

    const onBlur = (e, influencerId, influenceeId) => {
        console.log('e.target.value:', e.target.value);
        dispatch({
            type: 'models/setInfluence',
            payload: {
                influence: e.target.value,
                influencerId,
                influenceeId,
            },
        });
    };

    useEffect(() => {
        const elem = tableRef.current;
        const onWheel = (e) => {
            if (document.activeElement === e.target && e.target.type === 'number') {
                e.preventDefault();
            }
        };
        elem.addEventListener('wheel', onWheel);
        return () => {
            if (elem) {
                elem.removeEventListener('wheel', onWheel);
            }
        };
    }, []);

    return (
        <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
            <Table ref={tableRef} size="small" stickyHeader aria-label="Component matrix table">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ ...topHeaderCellStyle }} />
                        {concepts.map(({ name, id }) => (
                            <TableCell key={`col-${id}`} sx={{ ...topHeaderCellStyle, verticalAlign: 'bottom' }}>
                                {name}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {concepts.map((concept, i) => {
                        const cellStyle = i % 2 === 0 ? oddRowCellStyle : evenRowCellStyle;
                        return (
                            <TableRow tabIndex={-1} key={`row-${concept.id}`}>
                                <TableCell
                                    variant="head"
                                    component="th"
                                    align="right"
                                    sx={{ position: 'sticky', left: 0, ...cellStyle, ...sideHeaderCellStyle }}
                                >
                                    {concept.name}
                                </TableCell>
                                {concepts.map((_concept) => {
                                    const relationship = findRelationship(concept, _concept);
                                    const influence = relationship?.influence ?? '';
                                    return (
                                        <TableCell
                                            key={`row-${_concept.id}`}
                                            align="center"
                                            sx={{
                                                ...cellStyle,
                                                position: 'relative',
                                                padding: 0,
                                                ...(influence !== '' && {
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        inset: 0,
                                                        backgroundColor: alpha(theme.palette.tabs.matrix, 0.1),
                                                        zIndex: 0,
                                                    },
                                                }),
                                                // '&:focus-within': {
                                                //     outline: `1px solid ${theme.palette.tabs.matrix}`,
                                                // },
                                            }}
                                            aria-label={`${concept.name} influences ${_concept.name} ${influence}`}
                                        >
                                            <Box
                                                component="input"
                                                id={`${concept.id}-${concept.id}-input`}
                                                size="small"
                                                type="number"
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                                sx={{
                                                    textAlign: 'center',
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    padding: 1,
                                                    height: '100%',
                                                    width: '100%',
                                                    fontSize: '1rem',
                                                    '&:focus': {
                                                        // backgroundColor: alpha(theme.palette.tabs.matrix, 0.2),
                                                        outline: `2px solid ${theme.palette.tabs.matrix}`,
                                                        zIndex: 5,
                                                    },
                                                }}
                                                defaultValue={influence}
                                                onBlur={(e) => onBlur(e, _concept.id, concept.id)}
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// export const Matrix = () => {
//     const { selectedModel } = useSelector((state) => state.models) || {};
//     const { concepts = [] } = selectedModel;

//     console.log('selectedModel.concepts:', selectedModel.concepts);

//     const columns = concepts.map((concept) => ({
//         field: concept.name,
//         headerName: concept.name,
//         editable: true,
//         type: 'number',
//         sortable: false,
//     }));
//     columns.unshift({
//         field: 'name',
//         headerName: '',
//         editable: false,
//         type: 'text',
//         sortable: false,
//         display: 'flex',
//     });
//     const rows = concepts.map((concept) => {
//         return {
//             id: concept.id,
//             name: concept.name,
//             ...concepts.reduce((acc, _concept) => {
//                 const isSameConcept = _concept.name === concept.name;
//                 return {
//                     ...acc,
//                     [_concept.name]: isSameConcept ? '' : 1 - Math.random() * 2,
//                     ...(isSameConcept && { editable: false }),
//                 };
//             }, {}),
//         };
//     });
//     const columnNames = columns.map(({ headerName }) => headerName);
//     return (
//         <DataGrid
//             rows={rows}
//             columns={columns}
//             disableColumnMenu
//             disableColumnResize={true}
//             disableRowSelectionOnClick={true}
//             autosizeOnMount
//             autosizeOptions={{
//                 columns: columnNames,
//                 includeOutliers: false,
//                 includeHeaders: true,
//                 // expand: false,
//             }}
//         />
//     );
// };
