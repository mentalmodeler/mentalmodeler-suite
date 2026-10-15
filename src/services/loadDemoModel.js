import { loadAndParseURL } from 'mm-modules';

// Loads the model named by the `?demo` query param. Resolves to the model (with a `filename`),
// or null when it couldn't be loaded -- in which case the user has already been told why.
export const loadDemoModel = async (url) => {
    const filename = url.substring(url.lastIndexOf('/') + 1, url.indexOf('.'));
    let model;
    try {
        model = await loadAndParseURL(url);
    } catch (error) {
        console.error('loadDemoModel failed:', error);
        alert(`Could not load a model from ${url}`);
        return null;
    }
    if (!model) {
        // parseMMP already alerted that the content couldn't be parsed.
        return null;
    }
    return { ...model, filename };
};
