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
