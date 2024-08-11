export const makeId = (prefix = '', length = 5) =>
    `${prefix}${Math.random()
        .toString(16)
        .slice(-(length - 15))}`;
