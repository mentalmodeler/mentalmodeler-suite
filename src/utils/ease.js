export const easeLinear = (x) => x;
export const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);
export const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
export const easeInOutQuart = (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
export const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
