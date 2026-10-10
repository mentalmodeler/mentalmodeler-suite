import { save } from 'mentalmodeler-js';
import { APP_VIEW } from '../slices/appSlice';

export const saveModelFromConceptMap = (view) => {
    console.log('saveModelFromConceptMap, view:', view);
    if (view === APP_VIEW.MODEL) {
        const model = save();
        console.log('model:', model);
        // save() returns undefined if the widget threw; dispatching that would blank
        // the selected model's concepts/groupNames (see docs/mentalmodeler-js-deploy-and-vendoring.md).
        if (!model) {
            console.error('saveModelFromConceptMap: concept map returned no data; keeping existing model');
            alert('Could not save the concept map. Your latest edits may be lost.');
            return () => {};
        }
        return (dispatch) => {
            dispatch({
                type: 'models/updateModelFromConceptMap',
                payload: { value: model },
            });
        };
    }
    return () => {};
};
