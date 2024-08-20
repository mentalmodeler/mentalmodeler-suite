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

// export const reader = (file) =>
//     new Promise((resolve, reject) => {
//         const fr = new FileReader();
//         fr.onload = () => resolve(fr);
//         fr.onerror = (err) => reject(err);
//         fr.readAsText(file);
//     });

// export const getFile = (input) => (input?.files?.length > 0 ? input.files[0] : null);
