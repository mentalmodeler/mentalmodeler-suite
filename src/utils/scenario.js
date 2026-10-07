export const DEFAULT_SCENARIO_OVERRIDE = { selected: true, influence: 0 };

// .mmp files (XML and some JSON) store these as strings ('True'/'False', '0', '0.5', ...),
// not JS booleans/numbers -- coerce explicitly rather than relying on truthiness, which treats
// the string '0' and 'False' as truthy.
const toSelected = (value) => {
    if (value === undefined) {
        return DEFAULT_SCENARIO_OVERRIDE.selected;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    return value === 'True' || value === 'true';
};

const toInfluence = (value) => (value === undefined ? DEFAULT_SCENARIO_OVERRIDE.influence : parseFloat(value) || 0);

export const getScenarioOverride = (scenario, conceptId) => {
    const override = (scenario?.concepts || []).find(({ id }) => id === conceptId);
    return {
        selected: toSelected(override?.selected),
        influence: toInfluence(override?.influence),
    };
};

// Same per-concept delta the table already shows as Increase/Decrease text,
// reshaped for the bar chart: non-clamped concepts only (clamped ones are
// scenario inputs, not outputs), zero-delta ones dropped since a flat bar is
// noise, not signal.
export const getScenarioChartData = (concepts, scenario, results) => {
    const resultById = new Map((results || []).map(({ id, influence }) => [id, influence]));
    return (concepts || [])
        .map((concept) => {
            const { influence } = getScenarioOverride(scenario, concept.id);
            return {
                id: concept.id,
                name: concept.name,
                value: resultById.get(concept.id) || 0,
                isClamped: !!influence,
            };
        })
        .filter(({ value, isClamped }) => !isClamped && value !== 0);
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
