import { useRef, useState } from 'react';
import { Transition } from 'react-transition-group';
import { getContainerStyle, getTransitionStyle, TRANSITION_STATES } from './utils';
import { Box } from '@mui/material';

export const ExpandableTransition = ({
    children,
    isExpanded,
    duration = 400,
    additionalTransitionProps,
    sx = {},
    transitionProps = {},
    onTransitionComplete = () => {},
}) => {
    const [containerHeight, setContainerHeight] = useState('');
    const nodeRef = useRef(null);

    const onTransition = (state) => {
        switch (state) {
            case TRANSITION_STATES.ENTER:
                setContainerHeight(0);
                break;
            case TRANSITION_STATES.ENTERING:
                requestAnimationFrame(() => setContainerHeight(nodeRef.current.scrollHeight));
                break;
            case TRANSITION_STATES.EXIT:
                setContainerHeight(nodeRef.current.offsetHeight);
                break;
            case TRANSITION_STATES.EXITING:
                requestAnimationFrame(() => setContainerHeight(0));
                break;
            case TRANSITION_STATES.ENTERED:
                setContainerHeight('');
                onTransitionComplete(state);
                break;
            case TRANSITION_STATES.EXITED:
                setContainerHeight(transitionProps?.unmountOnExit === false ? 0 : '');
                onTransitionComplete(state);
                break;
            default:
                break;
        }
    };

    const transition = getTransitionStyle(duration, additionalTransitionProps, isExpanded);
    const containerStyles = getContainerStyle(containerHeight);

    return (
        <Transition
            nodeRef={nodeRef}
            in={isExpanded}
            onEnter={() => onTransition(TRANSITION_STATES.ENTER)}
            onEntering={() => onTransition(TRANSITION_STATES.ENTERING)}
            onEntered={() => onTransition(TRANSITION_STATES.ENTERED)}
            onExit={() => onTransition(TRANSITION_STATES.EXIT)}
            onExiting={() => onTransition(TRANSITION_STATES.EXITING)}
            onExited={() => onTransition(TRANSITION_STATES.EXITED)}
            timeout={duration}
            mountOnEnter
            unmountOnExit
            data-testid="expandable-transition-root-element"
            {...transitionProps}
        >
            <Box
                className="expandable-transition"
                sx={{
                    transition,
                    ...containerStyles,
                    ...sx,
                }}
                ref={nodeRef}
            >
                {children}
            </Box>
        </Transition>
    );
};
