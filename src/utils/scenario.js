export const DEFAULT_SCENARIO_OVERRIDE = { selected: true, influence: 0 };

export const getScenarioOverride = (scenario, conceptId) => {
    const override = (scenario?.concepts || []).find(({ id }) => id === conceptId);
    return { ...DEFAULT_SCENARIO_OVERRIDE, ...override };
};

export const getPredictionScore = (concepts, scenario, results) => {
    const resultById = new Map((results || []).map(({ id, influence }) => [id, influence]));

    const scoreable = (concepts || []).filter((concept) => {
        const { selected, influence } = getScenarioOverride(scenario, concept.id);
        const preferredState = parseFloat(concept.preferredState || 0);
        return selected && !influence && preferredState !== 0;
    });

    if (scoreable.length === 0) {
        return NaN;
    }

    const correct = scoreable.filter((concept) => {
        const preferredState = parseFloat(concept.preferredState || 0);
        const actualState = resultById.get(concept.id) || 0;
        return (preferredState > 0 && actualState > 0) || (preferredState < 0 && actualState < 0);
    });

    return Math.round(((100 * correct.length) / scoreable.length) * 100) / 100;
};
