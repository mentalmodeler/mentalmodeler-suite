import { runInference, runScenario, sigm, tanh } from 'mm-modules';
import { runScenarioCalculation } from './scenarioEngine';

const concept = (id, name, relationships = []) => ({ id, name, relationships });
const rel = (id, influence) => ({ id, influence: `${influence}` });

// A feedback loop (A <-> B) with a second influence on B and a side branch, so the inference
// rules give visibly different answers.
const model = {
    concepts: [
        concept('a', 'A', [rel('b', 0.5)]),
        concept('b', 'B', [rel('a', -0.7), rel('c', 0.3)]),
        concept('c', 'C', [rel('b', 0.8)]),
    ],
};
const scenario = (concepts, settings) => ({ name: 'S', concepts, ...(settings ? { settings } : {}) });
const clampA = [{ id: 'a', selected: 'True', influence: '1' }];

// What the app did before settings existed: runScenario, clamped by position, sigmoid.
const legacyResults = (clampedScenario, clampFn) =>
    runScenario(
        model,
        {
            concepts: model.concepts.map(({ id, name }) => {
                const override = clampedScenario.concepts.find((c) => c.id === id);
                return { name, influence: override ? override.influence : 0 };
            }),
        },
        clampFn,
    );

const expectSameResults = (actual, expected) => {
    expect(actual.map(({ id }) => id)).toEqual(expected.map(({ id }) => id));
    actual.forEach(({ influence }, i) => expect(influence).toBeCloseTo(expected[i].influence, 10));
};

describe('runScenarioCalculation', () => {
    it('resolves to no results for a model with no concepts', async () => {
        expect(await runScenarioCalculation({ model: { concepts: [] }, scenario: scenario([]) })).toEqual({
            results: [],
        });
        expect(await runScenarioCalculation({ model: {}, scenario: scenario([]) })).toEqual({ results: [] });
    });

    it('gives what the app gave before settings existed when the scenario has none', async () => {
        const { results } = await runScenarioCalculation({ model, scenario: scenario(clampA) });
        expectSameResults(results, legacyResults(scenario(clampA), sigm));
    });

    it('uses tanh for the hyperbolic tangent setting', async () => {
        const withTanh = scenario(clampA, { squash: 'hyperbolic tangent' });
        const { results } = await runScenarioCalculation({ model, scenario: withTanh });
        expectSameResults(results, legacyResults(withTanh, tanh));
    });

    it('uses the rule in the scenario settings, and matches runInference with the same inputs', async () => {
        const modified = scenario(clampA, { rule: 'modified kosko' });
        const { results } = await runScenarioCalculation({ model, scenario: modified });
        const direct = runInference(model, { clamps: [{ id: 'a', value: 1 }], settings: modified.settings });
        expectSameResults(results, direct);

        const { results: defaults } = await runScenarioCalculation({ model, scenario: scenario(clampA) });
        const biggestDifference = Math.max(...results.map(({ influence }, i) => Math.abs(influence - defaults[i].influence)));
        expect(biggestDifference).toBeGreaterThan(0.001);
    });

    it('clamps only concepts with a non-zero influence, reading string influences as numbers', async () => {
        const mixed = scenario([
            { id: 'a', selected: 'True', influence: '0.5' },
            { id: 'b', selected: 'True', influence: '0' },
        ]);
        const { results } = await runScenarioCalculation({ model, scenario: mixed });
        expect(results.map(({ id }) => id)).toEqual(['b', 'c']);
    });

    it('runs with the defaults when the settings are invalid, without throwing', async () => {
        const garbage = scenario(clampA, { rule: 'garbage', squash: 7, lambda: 'abc', noiseThreshold: -4 });
        const { results } = await runScenarioCalculation({ model, scenario: garbage });
        const { results: defaults } = await runScenarioCalculation({ model, scenario: scenario(clampA) });
        expect(results).toEqual(defaults);
    });
});
