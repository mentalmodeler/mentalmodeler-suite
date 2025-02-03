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

const saveFile = (filename) => {
    const json = getJson(store);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');

    const url = window.URL.createObjectURL(blob);
    link.download = filename;
    link.href = url;
    link.dataset.downloadurl = ['text/json', link.download, link.href].join(':');

    const evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove();
    window.URL.revokeObjectURL(url);

    return filename;
};

function writeLocalFile({ content, name, type }) {
    try {
        let isFileSaverSupported = !!new Blob(); // eslint-disable-line
        let url = content;
        if (type === 'json') {
            var bb = new Blob([content], { type: 'application/json' });
            url = window.URL.createObjectURL(bb);
        } else if (type === 'canvas') {
            url = content.toDataURL();
        }
        const link = document.createElement('a');
        if (typeof link.download === 'string') {
            saveAs(url, name);
        } else {
            if (type === 'json') {
                window.open(url);
            } else {
                alert('Image download not supported in your current browser. Please use a modern browser.');
            }
        }
        link.remove();
        type === 'json' && url && window.URL.revokeObjectURL(url);
    } catch (e) {
        console.log('ERROR - save\ne:', e, '\ntype:', type, ', name:', name, '\ncontent:', content);
    }
}
// export const reader = (file) =>
//     new Promise((resolve, reject) => {
//         const fr = new FileReader();
//         fr.onload = () => resolve(fr);
//         fr.onerror = (err) => reject(err);
//         fr.readAsText(file);
//     });

// export const getFile = (input) => (input?.files?.length > 0 ? input.files[0] : null);
