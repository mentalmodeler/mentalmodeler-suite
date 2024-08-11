import { useEffect, useState, useRef } from 'react';

export const normalize = (value, [min, max] = [-100, 100]) => Math.min(Math.max(min, value), max);

export const roundTo = (number, precision = 4) => +`${Math.round(`${number}e+${precision}`)}e-${precision}`;

const getEvent = (e) => ({
    ev: e,
    touch: (e && e.touches && e.touches[0]) || e,
});

const getScrollAxis = ({ scrollAxis, xPixels, yPixels }) =>
    scrollAxis.current || (Math.abs(xPixels) >= Math.abs(yPixels) ? 'x' : 'y');

export const usePan = ({ ref, preventVerticalScrolling }) => {
    const [pan, setPan] = useState({
        xPercent: 0,
        xPixels: 0,
        yPercent: 0,
        yPixels: 0,
        touchState: '',
    });

    const x = useRef(null);
    const y = useRef(null);

    // needed for mouse interactions
    const mouseMoved = useRef(false);
    const scrollAxis = useRef('');

    const handleClick = (e) => {
        if (mouseMoved.current) {
            e.stopPropagation();
            e.preventDefault();
        }
        mouseMoved.current = false;
    };

    useEffect(() => {
        /* istanbul ignore else */
        if (pan.touchState === 'end') {
            // reset pan values
            setPan({
                xPercent: 0,
                xPixels: 0,
                yPercent: 0,
                yPixels: 0,
                touchState: '',
            });
        }
    }, [pan]);

    useEffect(() => {
        const handleMove = (e) => {
            const { ev, touch } = getEvent(e);
            const currentTarget = ref.current;
            const xDiff = x.current - touch.clientX;
            const yDiff = y.current - touch.clientY;
            const xPixels = Math.round(xDiff);
            const yPixels = Math.round(yDiff);
            mouseMoved.current = true;
            scrollAxis.current = getScrollAxis({
                scrollAxis,
                xPixels,
                yPixels,
            });
            /* istanbul ignore else */
            if (scrollAxis.current === 'x' && (ev.type === 'mousemove' || preventVerticalScrolling)) {
                ev.preventDefault();
            }
            /* istanbul ignore else */
            setPan((prevPan) => ({
                ...prevPan,
                ...(scrollAxis.current === 'x' && {
                    xPercent: normalize(-roundTo(xDiff / currentTarget.clientWidth) * 100),
                    xPixels,
                }),
                ...(scrollAxis.current === 'y' && {
                    yPercent: normalize(-roundTo(yDiff / currentTarget.clientHeight) * 100),
                    yPixels,
                }),
                touchState: 'move',
            }));
        };

        const handleEnd = () => {
            x.current = null;
            y.current = null;
            scrollAxis.current = '';

            /* istanbul ignore else */
            if (typeof window !== 'undefined') {
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleEnd);
            }
            setPan((prevPan) => ({
                ...prevPan,
                touchState: 'end',
            }));
        };

        const handleStart = (e) => {
            const { touch, ev } = getEvent(e);
            x.current = touch.clientX;
            y.current = touch.clientY;

            mouseMoved.current = false;
            // for mouse handling, now add mousemove and mouseup listener on the window
            /* istanbul ignore else */
            if (ev.type === 'mousedown' && typeof window !== 'undefined') {
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleEnd);
            }

            setPan((prevPan) => ({
                ...prevPan,
                touchState: 'start',
            }));
        };

        const elem = ref && ref.current;
        /* istanbul ignore else */
        if (elem) {
            elem.addEventListener('touchstart', handleStart, {
                passive: false,
            });
            elem.addEventListener('touchmove', handleMove, {
                passive: false,
            });
            elem.addEventListener('touchend', handleEnd, {
                passive: false,
            });
            elem.addEventListener('mousedown', handleStart);
            // for mouse devices, mousemove and mouseup listeners
            // are added on the window when mousedown is handled
            elem.addEventListener('click', handleClick, { capture: true });
        }

        return () => {
            elem.removeEventListener('touchstart', handleStart);
            elem.removeEventListener('touchmove', handleMove, {
                passive: false,
            });
            elem.removeEventListener('touchend', handleEnd);
            elem.removeEventListener('mousedown', handleStart);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            elem.addEventListener('click', handleClick, { capture: true });
        };
    }, [ref, preventVerticalScrolling]);

    return pan;
};
