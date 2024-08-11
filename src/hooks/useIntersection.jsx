import { useCallback, useRef, useState } from 'react';

export const useIntersection = (options) => {
    const [entry, setEntry] = useState(null);
    const observer = useRef();
    const elementRef = useRef(null);
    /* eslint-disable react-hooks/exhaustive-deps */
    const ref = useCallback(
        (element) => {
            if (observer.current) {
                observer.current.disconnect();
                observer.current = null;
            }

            if (element === null) {
                setEntry(null);
                elementRef.current = null;
                return;
            }
            elementRef.current = element;
            observer.current = new IntersectionObserver(([_entry]) => {
                setEntry(_entry);
            }, options);
            observer.current.observe(element);
        },
        [options && options.rootMargin, options && options.root, options && options.threshold],
    );
    /* eslint-enable react-hooks/exhaustive-deps */

    return {
        ref,
        elementRef,
        entry,
        disconnect: observer.current && observer.current.disconnect,
    };
};
