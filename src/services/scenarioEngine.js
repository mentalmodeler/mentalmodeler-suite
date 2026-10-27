import { runInference } from 'mm-modules';
import { getScenarioOverride } from '../utils/scenario';

// The only call site for mm-modules' scenario engine. Kept async and JSON-shaped (the settings
// are the plain object saved on the scenario, not function references) so a future swap to a
// server- or worker-computed scenario only touches this function.
//
// An influence of 0 on a scenario concept means "not clamped", as it always has in this app, so
// only non-zero influences become clamps. Missing or invalid settings fall back to the defaults
// (Kosko, sigmoid, lambda 1, no noise threshold) inside runInference.
export const runScenarioCalculation = async ({ model, scenario }) => {
    if (!model.concepts || model.concepts.length === 0) {
        return { results: [] };
    }
    const clamps = model.concepts.flatMap(({ id }) => {
        const { influence } = getScenarioOverride(scenario, id);
        return influence ? [{ id, value: influence }] : [];
    });

    const results = runInference(model, { clamps, settings: scenario?.settings });

    return { results };
};
