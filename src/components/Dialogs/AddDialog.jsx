import { useState } from 'react';
import { DialogBaseActions, DialogBaseContent, DialogBaseTitle } from '../../utils/slotUtils';
import { DialogBase } from './DialogBase';
import { Box, Button, TextField } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { createModel } from '../../utils/utils';

const labels = {
    model: 'Model name',
    scenario: 'Scenario name',
};

const isEmpty = (value) => value.trim() === '';

const validate = (key, value) => {
    const emptyMessage = isEmpty(value) ? `${labels[key]} cannot be blank` : null;
    switch (key) {
        default:
            return emptyMessage;
    }
};

const hasError = (errors) => Object.values(errors).some((error) => !!error);

export const AddDialog = () => {
    const dispatch = useDispatch();
    const { addDialogOpen } = useSelector((state) => state.app) || {};
    const [formErrors, setFormErrors] = useState({
        model: null,
        scenario: null,
    });
    const onClose = () =>
        dispatch({
            type: 'app/setField',
            payload: {
                field: 'addDialogOpen',
                value: false,
            },
        });
    const [formValues, setFormValues] = useState({
        model: 'Model',
        scenario: 'Scenario',
    });
    const handleChange = (value, key) => {
        setFormValues((prev) => {
            return {
                ...prev,
                [key]: value,
            };
        });

        if (formErrors[key]) {
            setFormErrors((prev) => ({
                ...prev,
                [key]: null,
            }));
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // validate data
        const _formErrors = { ...formErrors };
        Object.entries(formValues).forEach(([key, value]) => {
            _formErrors[key] = validate(key, value);
        });
        // set form errors or send request
        if (hasError(_formErrors)) {
            setFormErrors(_formErrors);
        } else {
            dispatch({
                type: 'models/addModel',
                payload: {
                    field: '',
                    value: createModel({ filename: formValues.model, scenarioName: formValues.scenario }),
                },
            });
            onClose();
        }
    };

    return (
        <DialogBase
            open={addDialogOpen}
            onClose={onClose}
            PaperProps={{
                component: 'form',
                onSubmit: handleSubmit,
            }}
        >
            <DialogBaseTitle>Add a new model</DialogBaseTitle>
            <DialogBaseContent>
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: ['1fr', '1fr', '1fr 1fr'],
                    }}
                >
                    {Object.entries(formValues).map(([key, value]) => (
                        <TextField
                            key={key}
                            fullWidth
                            inputProps={{ sx: { backgroundColor: '#fff' } }}
                            id={`${key}-entry`}
                            label={labels[key] || 'Label missing'}
                            value={value}
                            onChange={({ target }) => {
                                handleChange(target.value, key);
                            }}
                            // if error, show error state and error message
                            {...(formErrors[key] && {
                                error: true,
                                helperText: formErrors[key],
                            })}
                        />
                    ))}
                </Box>
            </DialogBaseContent>
            <DialogBaseActions>
                <Button variant="text" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="contained" type="submit">
                    Add model
                </Button>
            </DialogBaseActions>
        </DialogBase>
    );
};
