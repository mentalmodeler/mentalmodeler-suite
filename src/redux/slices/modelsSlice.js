// jobs redux slice with thunks
// NOTE: using Immer to manage state (included as middleware)
// https://immerjs.github.io/immer/docs/introduction
import { createSlice } from '@reduxjs/toolkit';
import { createModel, makeAppId, parseScenarioId } from '../../utils/utils';

const updateInfluence = ({ concepts, influencerId, influenceeId, influence }) =>
    concepts.map((concept) => {
        if (concept.id !== influencerId) {
            return concept;
        }
        const relationships = concept.relationships.map((relationship) => {
            if (relationship.id !== influenceeId) {
                return relationship;
            }
            return {
                ...relationship,
                influence,
                lastUpdated: Date.now(),
            };
        });
        return {
            ...concept,
            relationships,
        };
    });

const updateModels = (models, model) => models.map((m) => (m.appId === model.appId ? model : m));

const appId = makeAppId();
const model = createModel({ appId });
const initialState = {
    models: [model],
    selectedId: appId,
    selectedScenarioId: '',
    selectedModel: model,
    selectedScenario: null,
};

const modelsSlice = createSlice({
    name: 'models',
    initialState,
    reducers: {
        reset(state) {
            Object.assign(state, initialState);
        },
        setInfluence(state, action) {
            const { influencerId, InfluenceeId, influence } = action.payload;
            console.log('setInfluence, influence:', influence);
            const model = {
                ...state.selectedModel,
                concepts: updateInfluence({
                    concepts: state.selectedModel.concepts,
                    influencerId,
                    InfluenceeId,
                    influence,
                }),
                info: {
                    ...state.selectedModel.info,
                    lastUpdated: Date.now(),
                },
            };
            state.selectedModel = model;
            state.models = updateModels(state.models, model);
        },
        setField(state, action) {
            const { field, value } = action.payload;
            state[field] = value;
        },
        selectScenario(state, action) {
            const { value } = action.payload;
            const { appId, id } = value;
            const { index } = parseScenarioId(id);
            const selectedModel = state.models.find((model) => model.appId === appId);
            state.selectedId = appId;
            state.selectedModel = selectedModel;
            state.selectedScenarioId = id;
            state.selectedScenario = selectedModel.scenarios[index];
        },
        selectModel(state, action) {
            const { value } = action.payload;
            state.selectedId = value;
            state.selectedScenarioId = '';
            state.selectedModel = state.models.find((model) => model.appId === value);
        },
        addModel(state, action) {
            const { value } = action.payload;
            const appId = value?.appId ? value?.appId : makeAppId();
            const model = {
                ...value,
                appId,
            };
            state.models.push(model);
            // deselect scenarios
            state.selectedScenarioId = '';
            // set selected id
            state.selectedId = appId;
            // set selected model
            state.selectedModel = model;
        },
        updateModel(state, action) {
            const { value } = action.payload;
            const model = value;
            state.selectedModel = model;
            state.models = updateModels(state.models, model);
        },
        updateModelFromConceptMap(state, action) {
            const { value } = action.payload;
            const { concepts, groupNames } = value?.js || {};
            const model = {
                ...state.selectedModel,
                concepts,
                groupNames,
            };
            state.selectedModel = model;
            state.models = updateModels(state.models, model);
        },
        deleteModel(state, action) {
            const { field, value } = action.payload;
            state[field] = value;
        },
    },
});

// export const { reset, setField, setInfluence, selectScenario, selectModel, addModel, changeModel, deleteModel } = modelsSlice.actions;

export default modelsSlice.reducer;
