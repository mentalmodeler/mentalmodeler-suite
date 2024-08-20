import { DeleteOutline, DescriptionOutlined, Download, PrintOutlined, SaveOutlined, Upload } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { Flex } from '../IFL/ifl';
// import { useSelector } from 'react-redux';
import { loadAndParse } from 'mm-modules';
import { createFileInput } from '../../utils/reader';
import { NavMenu } from './NavMenu';
import { useDispatch } from 'react-redux';

export const GlobalNav = () => {
    const dispatch = useDispatch();

    const loadAndParseLocalModels = (e) => {
        const fileList = e?.target?.files;
        return (
            fileList &&
            fileList.length > 0 &&
            Array.from(fileList).forEach(async (f) => {
                const model = {
                    filename: f.name.split('.')[0],
                    ...(await loadAndParse(f)),
                };

                dispatch({
                    type: 'models/addModel',
                    payload: {
                        field: '',
                        value: model,
                    },
                });
            })
        );
    };

    const navItems = [
        {
            type: 'button',
            label: 'New',
            id: 'new',
            icon: <DescriptionOutlined />,
            action: () => {
                dispatch({
                    type: 'app/setField',
                    payload: {
                        field: 'addDialogOpen',
                        value: true,
                    },
                });
            },
        },
        {
            type: 'menu',
            label: 'Load',
            id: 'load',
            icon: <Download />,
            items: [
                {
                    label: 'Load MMP',
                    id: 'load',
                    icon: <Download />,
                    action: () => {
                        const input = createFileInput({
                            onchange: (e) => loadAndParseLocalModels(e),
                        });
                        input.click();
                    },
                },
                {
                    label: 'Import CSV',
                    id: 'importcsv',
                    icon: <Download />,
                    action: () => {
                        alert('Coming soon... Import csv');
                    },
                },
            ],
        },
        {
            type: 'menu',
            label: 'Save',
            id: 'save',
            icon: <SaveOutlined />,
            items: [
                {
                    label: 'Save MMP',
                    id: 'savemmp',
                    icon: <SaveOutlined />,
                    action: () => {
                        alert('Coming soon... Save mmp');
                    },
                },
                {
                    label: 'Save Compare Ref',
                    id: 'savecompareref',
                    icon: <SaveOutlined />,
                    action: () => {
                        alert('Coming soon... Save compare ref mmp');
                    },
                },
            ],
        },
        {
            type: 'menu',
            label: 'Export',
            id: 'export',
            icon: <Upload />,
            items: [
                {
                    label: 'Export CSV',
                    id: 'exportcsv',
                    icon: <Upload />,
                    action: () => {
                        alert('Coming soon... Export csv');
                    },
                },
                {
                    label: 'Export XLS',
                    id: 'exportxls',
                    icon: <Upload />,
                    action: () => {
                        alert('Coming soon... Export xls');
                    },
                },
            ],
        },
        {
            type: 'button',
            label: 'Remove',
            id: 'remove',
            icon: <DeleteOutline />,
            action: () => {
                alert('Coming soon... Remove selected mmp/scenario');
            },
        },
        {
            type: 'button',
            label: 'Print',
            id: 'print',
            icon: <PrintOutlined />,
            action: () => {
                alert('print');
            },
        },
    ];

    return (
        <Box
            sx={{
                gridArea: 'global-nav',
                backgroundColor: 'bg.darkest',
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr',
            }}
        >
            <Typography variant="logo" sx={{ paddingBlock: 1, paddingInline: 2, backgroundColor: 'bg.darkest' }}>
                <Box component="span">Mental</Box>
                <Box component="span" sx={{ color: 'tabs.model' }}>
                    Modeler
                </Box>
            </Typography>
            <Flex
                component="ul"
                sx={{
                    gap: 1,
                    paddingBlock: 1,
                    paddingInline: 2,
                    listStyle: 'none',
                    margin: 0,
                    flexWrap: 'wrap',
                }}
            >
                {navItems.map((item) => {
                    const component =
                        item?.type === 'menu' ? (
                            <NavMenu item={item} />
                        ) : (
                            <Button size="small" variant="global-nav" startIcon={item.icon} onClick={item.action}>
                                {item.label}
                            </Button>
                        );
                    return (
                        <Box component="li" key={item.id} sx={{ flexShrink: 0 }}>
                            {component}
                        </Box>
                    );
                })}
            </Flex>
        </Box>
    );
};

// if (fileInputRef.current) {
// const readFile = async ({ target }) => {
//     const file = getFile(target);
//     if (file) {
//         const { result } = await reader(target.files[0]);
//         console.log('result:', result);
//     }
//     fileInputRef.current.removeEventListener('change', readFile);
// };
// fileInputRef.current.removeEventListener('change', readFile);
// fileInputRef.current.addEventListener('change', readFile);
// fileInputRef.current.onchange = async ({ target }) => {
//     const file = getFile(target);
//     if (file) {
//         const { result } = await reader(target.files[0]);
//         console.log('result:', result);
//     }
//     delete target.onchange;
// };
// fileInputRef.current.click();
// }

// let input = document.createElement('input');
// input.type = 'file';
// input.multiple = true;
// input.onchange = (e) => {
//     loadAndParseLocalModels(e);
//     delete input.onchange;
//     input.remove();
//     input = null;
// };
