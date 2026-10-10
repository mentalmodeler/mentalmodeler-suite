import { screenshot } from 'mentalmodeler-js';
import store from '../redux/data/store';
import { APP_VIEW } from '../redux/slices/appSlice';
import { makeScenarioId } from '../utils/utils';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const showBlocker = () => {
    const overlay = document.createElement('div');
    overlay.className = 'mm-print-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '9999',
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '24px',
    });
    overlay.textContent = 'Printing…';
    document.body.appendChild(overlay);
    return overlay;
};

const setView = (view) => {
    store.dispatch({ type: 'app/setField', payload: { field: 'view', value: view } });
};

// Rasterizes a panel by DOM id. Adds .printable first so scrollable/clipped
// containers (overflow: auto, fixed height) expand to their full content
// before capture, matching mentalmodeler-scenario's identical technique.
const rasterizePanel = async (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) {
        return null;
    }
    // window.html2canvas is provided by mentalmodeler-js on import
    if (typeof window.html2canvas === 'undefined') {
        console.error('print: window.html2canvas is not defined; skipping panel', elementId);
        return null;
    }
    element.classList.add('printable');
    try {
        return await window.html2canvas(element, { allowTaint: true, logging: false });
    } finally {
        element.classList.remove('printable');
    }
};

const appendCanvas = (printArea, canvas, { noBreak = false } = {}) => {
    if (!canvas) {
        return;
    }
    if (noBreak) {
        canvas.classList.add('no-break');
    }
    printArea.appendChild(canvas);
};

// Switches through Model, Metrics, and every scenario on the selected model,
// capturing each as a canvas, then opens the browser print dialog. Mirrors
// mentalmodeler-scenario's views/header.js print()/_printModel()/
// _printMetrics()/_printScenarios(), including the fixed waits for each tab
// to render before capture - not watching for a resolve signal because none
// of these panels expose one, same constraint legacy had.
export const printModel = async () => {
    const printArea = document.getElementById('printArea');
    if (!printArea) {
        return;
    }
    printArea.innerHTML = '';

    const originalView = store.getState().app.view;
    const overlay = showBlocker();

    const cleanup = () => {
        printArea.style.display = 'none';
        printArea.innerHTML = '';
        setView(originalView);
        overlay.remove();
    };

    try {
        setView(APP_VIEW.MODEL);
        await wait(500);
        appendCanvas(printArea, await screenshot());

        setView(APP_VIEW.METRICS);
        await wait(500);
        appendCanvas(printArea, await rasterizePanel('metricsPanel'), { noBreak: true });

        const { selectedModel } = store.getState().models;
        const scenarios = selectedModel?.scenarios || [];
        setView(APP_VIEW.SCENARIO);
        for (let i = 0; i < scenarios.length; i++) {
            const id = makeScenarioId(selectedModel.appId, scenarios[i].name, i);
            store.dispatch({
                type: 'models/selectScenario',
                payload: { value: { appId: selectedModel.appId, id } },
            });
            await wait(700);
            appendCanvas(printArea, await rasterizePanel('scenarioPanel'), { noBreak: true });
        }

        printArea.style.display = 'block';
        window.addEventListener('afterprint', cleanup, { once: true });
        window.print();
    } catch (error) {
        console.error('Print failed:', error);
        alert('Printing error.');
        cleanup();
    }
};
