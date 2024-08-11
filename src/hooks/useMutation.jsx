import { useEffect, useState } from 'react';

const DEFAULT_OPTIONS = {
    config: { attributes: true, childList: true, subtree: true },
};
export const useMutation = (
    targetEl,
    cb,
    options = DEFAULT_OPTIONS,
    disconnect
) => {
    const [observer, setObserver] = useState(null);

    useEffect(() => {
        const obs = new MutationObserver(cb);
        setObserver(obs);
    }, [cb, options, setObserver]);

    useEffect(() => {
        if (!observer || !targetEl) {
            return;
        } else if (disconnect && observer) {
            observer.disconnect();
        } else {
            const { config } = options;
            observer.observe(targetEl, config);
        }
        return () => {
            if (observer) {
                observer.disconnect();
            }
        };
    }, [observer, targetEl, options, disconnect]);
};
