import { describe, expect, it } from 'vitest';
import { getScenarioChartData } from './scenario';

describe('getScenarioChartData', () => {
    const concepts = [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
        { id: 'd', name: 'D' },
    ];
    const results = [
        { id: 'a', influence: 0.5 },
        { id: 'b', influence: 0.4 },
        { id: 'c', influence: 0.3 },
        { id: 'd', influence: 0 },
    ];

    it('keeps selected, unclamped concepts with a non-zero delta', () => {
        expect(getScenarioChartData(concepts, { concepts: [] }, results).map(({ id }) => id)).toEqual(['a', 'b', 'c']);
    });

    it('drops clamped concepts', () => {
        const scenario = { concepts: [{ id: 'a', selected: true, influence: 0.5 }] };
        expect(getScenarioChartData(concepts, scenario, results).map(({ id }) => id)).toEqual(['b', 'c']);
    });

    it('drops concepts that are unchecked in the scenario', () => {
        const scenario = { concepts: [{ id: 'b', selected: false, influence: 0 }] };
        expect(getScenarioChartData(concepts, scenario, results).map(({ id }) => id)).toEqual(['a', 'c']);
    });
});
