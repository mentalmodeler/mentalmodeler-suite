import { Table, TableContainer, TableHead, TableRow, TableCell, TableBody, alpha } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { findRelationship } from 'mm-modules';
import { useEffect, useRef } from 'react';
import { useTheme } from '@emotion/react';
import {
    evenRowCellStyle,
    getValueCellStyle,
    getValueInputStyle,
    oddRowCellStyle,
    sideHeaderCellStyle,
    topHeaderCellStyle,
} from '../../constants/styles';
import { NormalizedNumberInput } from '../NormalizedNumberInput/NormalizedNumberInput';

export const Matrix = () => {
    const { selectedModel } = useSelector((state) => state.models) || {};
    const { concepts = [] } = selectedModel || {};
    const dispatch = useDispatch();
    const theme = useTheme();
    const tableRef = useRef(null);

    const onCommit = (influencerId, influenceeId, influence) => {
        dispatch({
            type: 'models/setInfluence',
            payload: {
                influence,
                influencerId,
                influenceeId,
            },
        });
    };

    useEffect(() => {
        const elem = tableRef.current;
        const onWheel = (e) => {
            // A focused number input changes its value on wheel. preventDefault() would stop that but also stops the
            // table scrolling, so leave the input instead: no value change, and the scroll goes through.
            if (document.activeElement === e.target && e.target.type === 'number') {
                e.target.blur();
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
        <TableContainer sx={{ height: '100%', overflow: 'auto', overscrollBehavior: 'none' }}>
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
                                    // a connection with no value is still a connection: show 0 (no effect), not blank
                                    const hasValue = relationship?.influence !== '' && relationship?.influence != null;
                                    const influence = relationship ? (hasValue ? relationship.influence : 0) : '';
                                    return (
                                        <TableCell
                                            key={`row-${_concept.id}`}
                                            align="center"
                                            sx={{
                                                ...cellStyle,
                                                ...getValueCellStyle({
                                                    color: theme.palette.tabs.matrix,
                                                    hasValue: influence !== '',
                                                }),
                                            }}
                                            aria-label={`${concept.name} influences ${_concept.name} ${influence}`}
                                        >
                                            <NormalizedNumberInput
                                                id={`${concept.id}-${_concept.id}-input`}
                                                value={influence}
                                                emptyValue=""
                                                showSlider
                                                onCommit={(val) => onCommit(concept.id, _concept.id, val)}
                                                sx={getValueInputStyle({ color: theme.palette.tabs.matrix })}
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
