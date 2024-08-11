export const TRANSITION_STATES = {
    ENTER: 'ENTER',
    ENTERING: 'ENTERING',
    ENTERED: 'ENTERED',
    EXIT: 'EXIT',
    EXITING: 'EXITING',
    EXITED: 'EXITED',
};

export const getContainerStyle = (height) =>
    typeof height === 'number' ? { overflow: 'hidden', height: `${height}px` } : { /*height: '', */ overflow: '' };

export const getTransitionStyle = (duration, additionalTransitionProps = [], isExpanded) =>
    ['height', ...(Array.isArray(additionalTransitionProps) ? additionalTransitionProps : [])].reduce(
        (acc, cur, index, array) => {
            acc = `${acc}${cur} ${duration}ms ${isExpanded ? 'ease-in' : 'ease-out'}${index < array.length - 1 ? ', ' : ''}`;
            return acc;
        },
        '',
    );
