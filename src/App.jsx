import { Box } from '@mui/material';
import { GlobalNav } from './components/GlobalNav/GlobalNav';
import { Tabs } from './components/Tabs/Tabs';
import { Content } from './components/Content/Content';
import { Files, FilesHeader } from './components/Files/Files';
// import { Tabs } from './components/Tabs/Tabs';

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
            {/* <ProjectDialog /> */}
        </>
    );
};

export default App;
