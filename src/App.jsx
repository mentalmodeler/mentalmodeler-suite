import { Box } from '@mui/material';
import { GlobalNav } from './components/GlobalNav/GlobalNav';
import { Tabs } from './components/Tabs/Tabs';
import { Content } from './components/Content/Content';
import { Files } from './components/Files/Files';
import { FilesHeader } from './components/Files/FilesHeader';
import { useEffect, useRef } from 'react';
import { loadAndParseURL } from 'mm-modules';
import { useDispatch } from 'react-redux';
import { AddDialog } from './components/Dialogs/AddDialog';

// const Content = () => (
//     <Routes>
//         <Route path="" element={<HomeCotent />} />
//         {routes.map(({ path, Component, props }, i) => (
//             <Route path={path} element={<Component {...props} />} key={`route-${i}`} />
//         ))}
//         <Route path="*" element={<Navigate to="/" />} />
//     </Routes>
// );

const App = () => {
    // const { pathname } = useLocation();
    // useEffect(() => {
    //     document.scrollingElement.scrollTop = 0;
    // }, [pathname]);
    const dispatch = useDispatch();
    const isMounted = useRef(false);
    // const { models } = useSelector((state) => state.models) || {};

    useEffect(() => {
        if (isMounted.current) {
            return;
        }
        isMounted.current = true;
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('init')) {
            const loadInitFile = async () => {
                const _url = searchParams.get('init');
                const altUrl = '/models/fire_model.mmp';
                // const altUrl = '/models/fish_wetland_ozesmi.json.mmp';
                const url = _url ? _url : altUrl;
                const filename = url.substring(url.lastIndexOf('/') + 1, url.indexOf('.'));
                const model = await loadAndParseURL(url);
                dispatch({
                    type: 'models/addModel',
                    payload: {
                        field: '',
                        value: {
                            ...model,
                            filename,
                        },
                    },
                });
            };
            loadInitFile();
        }
    }, []);

    return (
        <>
            <Box
                sx={{
                    height: '100vh',
                    overflow: 'auto',
                    display: 'grid',
                    gridTemplateAreas: `
                        'global-nav global-nav'
                        'files-header tabs'
                        'files content'
                    `,
                    gridTemplateRows: 'min-content min-content 1fr',
                    gridTemplateColumns: '236px 1fr',
                    backgroundColor: 'bg.darker',
                }}
            >
                <GlobalNav />
                <FilesHeader />
                <Files />
                <Tabs />
                <Content />
            </Box>
            <AddDialog />
        </>
    );
};

export default App;
