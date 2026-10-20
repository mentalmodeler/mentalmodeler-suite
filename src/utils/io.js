export const createFileInput = ({ onchange = () => {}, props = {} }) => {
    let input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    Object.entries(props).forEach((key, value) => {
        input[key] = value;
    });
    input.onchange = (e) => {
        onchange(e);
        delete input.onchange;
        input.remove();
        input = null;
    };
    return input;
};

export const downloadBlob = (blob, filename) => {
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.download = filename;
    link.href = url;
    link.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
    link.remove();
    window.URL.revokeObjectURL(url);
};
