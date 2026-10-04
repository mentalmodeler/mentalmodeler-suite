// jobs redux slice with thunks
// NOTE: using Immer to manage state (included as middleware)
// https://immerjs.github.io/immer/docs/introduction
import { createSlice } from '@reduxjs/toolkit';
import { createModel, makeAppId, makeScenarioId, parseScenarioId } from '../../utils/utils.js';

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

const updateConceptField = ({ concepts, conceptId, field, value }) =>
    concepts.map((concept) => (concept.id === conceptId ? { ...concept, [field]: value } : concept));

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
        updateInfo(state, action) {
            const { field, value } = action.payload;
            const model = {
                ...state.selectedModel,
                info: {
                    ...state.selectedModel.info,
                    [field]: value,
                    lastUpdated: Date.now(),
                },
            };
            state.selectedModel = model;
            state.models = updateModels(state.models, model);
        },
        setPreferredState(state, action) {
            const { conceptId, value } = action.payload;
            const model = {
                ...state.selectedModel,
                concepts: updateConceptField({
                    concepts: state.selectedModel.concepts,
                    conceptId,
                    field: 'preferredState',
                    value,
                }),
            };
            state.selectedModel = model;
            state.models = updateModels(state.models, model);
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
            state.selectedScenario = null;
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
            state.selectedScenario = null;
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
        removeSelected(state) {
            const { selectedId, selectedScenarioId, models } = state;
            const modelIndex = models.findIndex((m) => m.appId === selectedId);
            if (modelIndex === -1) {
                return;
            }
            const model = models[modelIndex];

            if (selectedScenarioId) {
                // never remove the last scenario
                if (model.scenarios.length <= 1) {
                    return;
                }
                const { index } = parseScenarioId(selectedScenarioId);
                const scenarios = model.scenarios.filter((_, i) => i !== Number(index));
                const updatedModel = { ...model, scenarios };
                const nextIndex = Math.min(Number(index), scenarios.length - 1);

                state.models = updateModels(models, updatedModel);
                state.selectedModel = updatedModel;
                state.selectedScenario = scenarios[nextIndex];
                state.selectedScenarioId = makeScenarioId(updatedModel.appId, scenarios[nextIndex].name, nextIndex);
            } else {
                // never remove the last model
                if (models.length <= 1) {
                    return;
                }
                const remaining = models.filter((_, i) => i !== modelIndex);
                const nextIndex = Math.min(modelIndex, remaining.length - 1);
                const nextModel = remaining[nextIndex];

                state.models = remaining;
                state.selectedId = nextModel.appId;
                state.selectedModel = nextModel;
                state.selectedScenarioId = '';
                state.selectedScenario = null;
            }
        },
        addScenario(state, action) {
            const { name } = action.payload;
            const scenarios = [...(state.selectedModel.scenarios || []), { name, concepts: [] }];
            const model = { ...state.selectedModel, scenarios };
            const index = scenarios.length - 1;

            state.selectedModel = model;
            state.models = updateModels(state.models, model);
            state.selectedScenarioId = makeScenarioId(model.appId, name, index);
            state.selectedScenario = scenarios[index];
        },
        updateScenarioName(state, action) {
            const { name } = action.payload;
            const { index } = parseScenarioId(state.selectedScenarioId);
            const scenarioIndex = Number(index);
            if (Number.isNaN(scenarioIndex)) {
                return;
            }
            const scenarios = (state.selectedModel.scenarios || []).map((scenario, i) =>
                i === scenarioIndex ? { ...scenario, name } : scenario,
            );
            const model = { ...state.selectedModel, scenarios };

            state.selectedModel = model;
            state.models = updateModels(state.models, model);
            state.selectedScenario = scenarios[scenarioIndex];
            state.selectedScenarioId = makeScenarioId(model.appId, name, scenarioIndex);
        },
        setScenarioConceptOverride(state, action) {
            const { conceptId, selected, influence } = action.payload;
            const { index } = parseScenarioId(state.selectedScenarioId);
            const scenarioIndex = Number(index);
            if (Number.isNaN(scenarioIndex)) {
                return;
            }
            const scenarios = (state.selectedModel.scenarios || []).map((scenario, i) => {
                if (i !== scenarioIndex) {
                    return scenario;
                }
                const exists = scenario.concepts.some(({ id }) => id === conceptId);
                const concepts = exists
                    ? scenario.concepts.map((c) => (c.id === conceptId ? { id: conceptId, selected, influence } : c))
                    : [...scenario.concepts, { id: conceptId, selected, influence }];
                return { ...scenario, concepts };
            });
            const model = { ...state.selectedModel, scenarios };

            state.selectedModel = model;
            state.models = updateModels(state.models, model);
            state.selectedScenario = scenarios[scenarioIndex];
        },
    },
});

// export const { reset, setField, setInfluence, selectScenario, selectModel, addModel, changeModel } = modelsSlice.actions;

export default modelsSlice.reducer;
