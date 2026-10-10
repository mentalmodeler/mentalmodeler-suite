import reducer from './modelsSlice';

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
