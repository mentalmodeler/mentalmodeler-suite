import { APP_VIEW } from '../slices/appSlice';

export const saveModelFromConceptMap = (view) => {
    console.log('saveModelFromConceptMap, view:', view);
    if (view === APP_VIEW.MODEL) {
        const model = window.MentalModelerConceptMap.save();
        console.log('model:', model);
        return (dispatch) => {
            dispatch({
                type: 'models/updateModelFromConceptMap',
                payload: { value: model },
            });
        };
    }
    return () => {};
};
