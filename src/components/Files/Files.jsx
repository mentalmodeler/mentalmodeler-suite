import { Box, Button, ToggleButton, Typography } from '@mui/material';
import { Flex } from '../IFL/ifl';
import { AddBoxOutlined, IndeterminateCheckBoxOutlined, PlayCircle, Schema } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useEffect } from 'react';
import { APP_VIEW } from '../../redux/slices/appSlice';
import { makeScenarioId } from '../../utils/utils';
import { saveModelFromConceptMap } from '../../redux/actions/models';

export const Files = () => {
    const { models, selectedId, selectedScenarioId } = useSelector((state) => state.models) || {};
    const { view } = useSelector((state) => state.app) || {};
    const dispatch = useDispatch();

    useEffect(() => {
        console.log('models:', models);
    }, [models.length]);

    return (
        <Box sx={{ gridArea: 'files', padding: 2, paddingBlockStart: 0, overflow: 'auto' }}>
            <Box
                sx={{
                    height: '100%',
                    backgroundColor: 'common.white',
                    borderRadius: 0,
                    overflow: 'auto',
                }}
            >
                <Box
                    component="ul"
                    sx={{
                        listStyle: 'none',
                        margin: 0,
                        padding: 1,
                    }}
                >
                    {models.map(({ filename, scenarios = [], appId }, i) => {
                        const isSelectedModel = appId === selectedId;
                        return (
                            <Box
                                component="li"
                                key={appId}
                                sx={{
                                    paddingBlock: 1,
                                    ...(i !== 0 && {
                                        borderBlockStart: `1px solid`,
                                        borderColor: 'grey.400',
                                    }),
                                }}
                            >
                                <ToggleButton
                                    selected={isSelectedModel && !selectedScenarioId}
                                    fullWidth
                                    size="small"
                                    fontSize="small"
                                    value={appId}
                                    onClick={() => {
                                        if (!isSelectedModel || !!selectedScenarioId) {
                                            dispatch(saveModelFromConceptMap(view));
                                            dispatch({
                                                type: 'models/selectModel',
                                                payload: {
                                                    value: appId,
                                                },
                                            });
                                            dispatch({
                                                type: 'app/setField',
                                                payload: {
                                                    field: 'view',
                                                    value: APP_VIEW.MODEL,
                                                },
                                            });
                                        }
                                    }}
                                >
                                    <Schema fontSize="small" sx={{ transform: 'rotate(-90deg) scale(0.8)' }} />
                                    <Typography variant="body2">{filename}</Typography>
                                </ToggleButton>
                                <SimpleTreeView
                                    selectedItems={[selectedScenarioId]}
                                    onSelectedItemsChange={(e, id) => {
                                        if (id !== 'scenarios' && id !== selectedScenarioId) {
                                            dispatch(saveModelFromConceptMap(view));
                                            dispatch({
                                                type: 'models/selectScenario',
                                                payload: {
                                                    value: {
                                                        id,
                                                        appId,
                                                    },
                                                },
                                            });
                                            dispatch({
                                                type: 'app/setField',
                                                payload: {
                                                    field: 'view',
                                                    value: APP_VIEW.SCENARIO,
                                                },
                                            });
                                        }
                                    }}
                                    defaultExpandedItems={['scenarios']}
                                    slots={{
                                        expandIcon: AddBoxOutlined,
                                        collapseIcon: IndeterminateCheckBoxOutlined,
                                        endIcon: PlayCircle,
                                    }}
                                >
                                    <TreeItem
                                        itemId="scenarios"
                                        variant="branch-control"
                                        label={
                                            <Flex gap={1}>
                                                <i>Scenarios</i>
                                                <Button
                                                    size="small"
                                                    variant="scenario-add"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        alert('Coming soon: Add a scenario');
                                                    }}
                                                    onKeyDown={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    Add
                                                </Button>
                                            </Flex>
                                        }
                                    >
                                        {scenarios.map(({ name }, i) => (
                                            <TreeItem
                                                key={`${name}-${i}`}
                                                itemId={makeScenarioId(appId, name, i)}
                                                label={name}
                                            />
                                        ))}
                                    </TreeItem>
                                </SimpleTreeView>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};
