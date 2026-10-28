// Drops only the last ".ext", so "fire_model.v2.mmp" keeps "fire_model.v2".
export const stripExtension = (name) => name.replace(/\.[^./\\]+$/, '') || name;

const STAMP = /_\d{4}-\d{2}-\d{2}_\d{4}$/;

// Removes one trailing save stamp so reopening and saving again doesn't stack stamps.
export const stripTimestamp = (name) => name.replace(STAMP, '') || name;

// What a model's `filename` is after loading a file by that name.
export const modelNameFromFile = (fileName) => stripTimestamp(stripExtension(fileName));

const pad = (value) => String(value).padStart(2, '0');

export const formatTimestamp = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`;

export const saveFilename = (model, date = new Date()) => `${model?.filename || 'model'}_${formatTimestamp(date)}.mmp`;

// appId and filename are per-session: loading assigns a fresh appId and takes the filename from the
// file's own name (the loader's parsed fields are spread last, so a stored filename would win).
export const toSaveModel = (model) => {
    const saved = { ...model };
    delete saved.appId;
    delete saved.filename;
    return saved;
};
