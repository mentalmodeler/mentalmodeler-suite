import { runScenario, sigm, tanh } from 'mm-modules';

const SQUASH_FUNCTIONS = {
    sigmoid: sigm,
    'hyperbolic tangent': tanh,
};

// The only call site for mm-modules' runScenario. Kept async and
// JSON-shaped (squashFunction as a string, not a function reference) so a
// future swap to a server-computed scenario only touches this function.
export const runScenarioCalculation = async ({ model, scenario, squashFunction }) => {
    const clampFn = SQUASH_FUNCTIONS[squashFunction] || sigm;
    const scenarioConcepts = model.concepts.map((concept) => {
        const override = (scenario.concepts || []).find(({ id }) => id === concept.id);
        return { name: concept.name, influence: override ? override.influence : 0 };
    });

    const results = runScenario(model, { concepts: scenarioConcepts }, clampFn);

    return { results };
};
