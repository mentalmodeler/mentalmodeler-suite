const getChars = (length = 4) =>
    Math.random()
        .toString(16)
        .slice(-(length - 15));

export const makeId = (prefix = '', length = 12) => `${prefix}${getChars(length)}`;

export const makeUuid = () => `${getChars(8)}-${getChars()}-${getChars()}-${getChars()}-${getChars(12)}`;

export const makeAppId = () => makeId('appId-');

export const SCENARIO_ID_DELIMITER = '::';

export const makeScenarioId = (appId, name, index) =>
    `${appId}${SCENARIO_ID_DELIMITER}${name}${SCENARIO_ID_DELIMITER}${index}`;

export const parseScenarioId = (id) => {
    const [appId, name, index] = id.split(SCENARIO_ID_DELIMITER);
    return { appId, name, index };
};

export const findRelationship = (influencer, influencee) => {
    const relationships = influencer?.relationships || [];
    return relationships.find(({ id }) => influencee.id === id);
};

export const createModel = ({ appId, filename = 'Model', scenarioName = 'Scenario' }) => ({
    groupNames: {
        0: '',
        1: '',
        2: '',
        3: '',
        4: '',
        5: '',
    },
    concepts: [],
    appId: appId || makeAppId(),
    filename,
    info: {
        name: 'Model',
        version: '1.0',
        author: '',
        description: '',
        id: makeUuid(),
        date: Date.now(),
    },
    scenarios: [
        {
            name: scenarioName,
            concepts: [
                // {
                //     "selected": "True",
                //     "name": "Natural Beauty",
                //     "id": "1",
                //     "influence": "1"
                // },
            ],
        },
    ],
});

export const isEmpty = (value) => value.trim() === '';

// Matches mentalmodeler-js's src/utils/util.js normalize() exactly (name, signature, defaults) —
// that's where influence values are normalized on blur in the concept-map editor itself.
export const normalize = (value, min = -1, max = 1) => Math.max(Math.min(value, max), min);

export const getMatrixRows = (concepts = []) => [
    ['', ...concepts.map(({ name }) => name)],
    ...concepts.map((concept) => [
        concept.name,
        ...concepts.map((_concept) => findRelationship(concept, _concept)?.influence ?? ''),
    ]),
];

// Canonical "answer key" export for mm-compare: strips x/y layout so a loaded
// file carries no visual map, and flags compareRef so -suite's own load path
// refuses to reopen it (loosely discourages students from viewing the answer).
export const toCompareRefModel = (model) => ({
    ...model,
    compareRef: true,
    concepts: (model?.concepts || []).map((concept) => {
        const stripped = { ...concept };
        delete stripped.x;
        delete stripped.y;
        return stripped;
    }),
});
