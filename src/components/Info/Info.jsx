import { Box, TextField } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

export const Info = () => {
    const { selectedModel } = useSelector((state) => state.models) || {};
    const { appId, info = {} } = selectedModel || {};
    const dispatch = useDispatch();

    const onBlur = (field) => (e) => {
        dispatch({
            type: 'models/updateInfo',
            payload: {
                field,
                value: e.target.value,
            },
        });
    };

    return (
        <Box
            key={appId}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: 2,
                maxWidth: 480,
            }}
        >
            <TextField
                label="Model name"
                id="info-name"
                defaultValue={info.name ?? ''}
                onBlur={onBlur('name')}
                fullWidth
            />
            <TextField
                label="Author"
                id="info-author"
                defaultValue={info.author ?? ''}
                onBlur={onBlur('author')}
                fullWidth
            />
            <TextField
                label="Description"
                id="info-description"
                defaultValue={info.description ?? ''}
                onBlur={onBlur('description')}
                multiline
                minRows={6}
                fullWidth
            />
        </Box>
    );
};
