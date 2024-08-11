import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';

export const useShowTouch = (size, sx = {}) => {
    const touchRef = useRef(null);

    useEffect(() => {
        const onTouch = (e) => {
            const style = touchRef.current?.style;
            if (e?.touches[0]) {
                const { clientX, clientY } = e.touches[0];
                if (clientX && clientY && style) {
                    style.top = `${clientY - size / 2}px`;
                    style.left = `${clientX - size / 2}px`;
                }
            }
            if (style) {
                style.visibility = e.type === 'touchend' ? 'hidden' : 'visible';
            }
        };
        window.addEventListener('touchstart', onTouch);
        window.addEventListener('touchmove', onTouch);
        window.addEventListener('touchend', onTouch);
        return () => {
            window.removeEventListener('touchstart', onTouch);
            window.removeEventListener('touchmove', onTouch);
            window.removeEventListener('touchend', onTouch);
        };
    }, [size]);

    return {
        size,
        touchRef,
        touchRefComponent: (
            <Box
                ref={touchRef}
                sx={{
                    position: 'fixed',
                    zIndex: '999999',
                    height: `${size}px`,
                    width: `${size}px`,
                    pointerEvents: 'none',
                    visibility: 'hidden',
                    borderRadius: 'full',
                    backgroundColor: '#00FF0033',
                    ...sx,
                }}
            />
        ),
    };
};
