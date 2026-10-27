import reducer from './modelsSlice';
import { makeScenarioId } from '../../utils/utils.js';

const baseState = (concepts) => {
    const model = { appId: 'm1', info: {}, concepts, groupNames: {} };
    return { models: [model], selectedId: 'm1', selectedScenarioId: '', selectedModel: model, selectedScenario: null };
};

const setInfluence = (state, influencerId, influenceeId, influence) =>
    reducer(state, { type: 'models/setInfluence', payload: { influencerId, influenceeId, influence } });

const relationship = (state, from, to) =>
    state.selectedModel.concepts.find((c) => c.id === from).relationships.find((r) => r.id === to);

const twoConcepts = () =>
    baseState([
        { id: 'a', name: 'A', relationships: [] },
        { id: 'b', name: 'B', relationships: [{ id: 'a', name: 'A', confidence: 0, influence: 0.1 }] },
    ]);

describe('models/setInfluence', () => {
    it('creates a relationship when the cell had none', () => {
        const state = setInfluence(twoConcepts(), 'a', 'b', 0.7);
        expect(relationship(state, 'a', 'b')?.influence).toBe(0.7);
    });

    it('gives a created relationship the shape mentalmodeler-js expects', () => {
        const { id, name, confidence, notes } = relationship(setInfluence(twoConcepts(), 'a', 'b', 0.7), 'a', 'b');
        expect({ id, name, confidence, notes }).toEqual({ id: 'b', name: 'B', confidence: 0, notes: '' });
    });

    it('creates a self relationship (diagonal cell)', () => {
        expect(relationship(setInfluence(twoConcepts(), 'a', 'a', -0.5), 'a', 'a')?.influence).toBe(-0.5);
    });

    it('updates an existing relationship without duplicating it', () => {
        const state = setInfluence(twoConcepts(), 'b', 'a', 0.9);
        expect(state.selectedModel.concepts.find((c) => c.id === 'b').relationships).toHaveLength(1);
        expect(relationship(state, 'b', 'a').influence).toBe(0.9);
    });

    it('leaves other concepts untouched', () => {
        const state = setInfluence(twoConcepts(), 'a', 'b', 0.7);
        expect(state.selectedModel.concepts.find((c) => c.id === 'b').relationships).toHaveLength(1);
    });

    it('does not create a relationship for an empty value', () => {
        expect(relationship(setInfluence(twoConcepts(), 'a', 'b', ''), 'a', 'b')).toBeUndefined();
    });

    it('keeps the models list in sync with selectedModel', () => {
        const state = setInfluence(twoConcepts(), 'a', 'b', 0.7);
        expect(state.models[0].concepts.find((c) => c.id === 'a').relationships).toHaveLength(1);
    });
});

describe('models/setScenarioSettings', () => {
    const scenarioState = (selectedIndex = 0) => {
        const scenarios = [
            { name: 'S0', concepts: [{ id: 'a', selected: true, influence: 0.5 }] },
            { name: 'S1', concepts: [] },
        ];
        const model = { appId: 'm1', info: {}, concepts: [], groupNames: {}, scenarios };
        return {
            models: [model],
            selectedId: 'm1',
            selectedModel: model,
            selectedScenarioId: makeScenarioId('m1', scenarios[selectedIndex].name, selectedIndex),
            selectedScenario: scenarios[selectedIndex],
        };
    };
    const setSettings = (state, settings) =>
        reducer(state, { type: 'models/setScenarioSettings', payload: { settings } });

    it('stores the settings on the selected scenario, in the model and in models', () => {
        const state = setSettings(scenarioState(), { rule: 'modified kosko' });
        expect(state.selectedScenario.settings).toEqual({ rule: 'modified kosko' });
        expect(state.selectedModel.scenarios[0].settings).toEqual({ rule: 'modified kosko' });
        expect(state.models[0].scenarios[0].settings).toEqual({ rule: 'modified kosko' });
    });

    it('merges into existing settings instead of replacing them', () => {
        const once = setSettings(scenarioState(), { rule: 'modified kosko' });
        const twice = setSettings(once, { lambda: 3 });
        expect(twice.selectedScenario.settings).toEqual({ rule: 'modified kosko', lambda: 3 });
    });

    it('leaves the other scenario and the scenario concepts alone', () => {
        const before = scenarioState();
        const state = setSettings(before, { squash: 'bivalent' });
        expect(state.selectedModel.scenarios[1]).toBe(before.selectedModel.scenarios[1]);
        expect(state.selectedScenario.concepts).toEqual(before.selectedScenario.concepts);
    });

    it('applies to whichever scenario is selected', () => {
        const state = setSettings(scenarioState(1), { squash: 'trivalent' });
        expect(state.selectedModel.scenarios[1].settings).toEqual({ squash: 'trivalent' });
        expect(state.selectedModel.scenarios[0].settings).toBeUndefined();
    });

    it('does nothing when no scenario is selected', () => {
        const before = { ...scenarioState(), selectedScenarioId: '', selectedScenario: null };
        const state = setSettings(before, { rule: 'rescaled kosko' });
        expect(state.selectedModel).toBe(before.selectedModel);
        expect(state.models).toBe(before.models);
    });
});
