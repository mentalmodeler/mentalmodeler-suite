/* eslint-disable no-undef */

import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ExpandableTransition, TRANSITION_STATES } from './index';

const Demo = ({ isExpandedInitially, onTransitionComplete }) => {
    const [isExpanded, setIsExpanded] = useState(isExpandedInitially);
    return (
        <>
            <button onClick={() => setIsExpanded(true)}>{'expand'}</button>
            <button onClick={() => setIsExpanded(false)}>{'collapse'}</button>
            <ExpandableTransition isExpanded={isExpanded} {...(onTransitionComplete && { onTransitionComplete })}>
                {new Array(6).fill('').map((_, index) => (
                    <div key={index} style={{ height: '100px' }} />
                ))}
            </ExpandableTransition>
        </>
    );
};

beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb());
});

afterEach(() => {
    jest.useRealTimers();
    window.requestAnimationFrame.mockRestore();
});

describe('ExpandableTransition', () => {
    test('renders without crashing when expanded initially', async () => {
        expect(() => render(<Demo isExpandedInitially={true} />)).not.toThrow();
    });

    test('renders without crashing when collapsed initially', async () => {
        expect(() => render(<Demo isExpandedInitially={false} />)).not.toThrow();
    });

    test('transitions from expanded to collapsed', async () => {
        const mockFn = jest.fn();

        render(<Demo isExpandedInitially={true} onTransitionComplete={mockFn} />);

        expect(screen.queryAllByTestId('expandable-transition-root-element')).toHaveLength(1);

        fireEvent.click(screen.queryByText('collapse'));

        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        expect(screen.queryAllByTestId('expandable-transition-root-element')).toHaveLength(0);
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn.mock.calls.pop()).toEqual([TRANSITION_STATES.EXITED]);
    });

    test('transitions from collapsed to expanded', async () => {
        const mockFn = jest.fn();

        render(<Demo isExpandedInitially={false} onTransitionComplete={mockFn} />);

        expect(screen.queryAllByTestId('expandable-transition-root-element')).toHaveLength(0);

        fireEvent.click(screen.queryByText('expand'));

        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        expect(screen.queryAllByTestId('expandable-transition-root-element')).toHaveLength(1);
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn.mock.calls.pop()).toEqual([TRANSITION_STATES.ENTERED]);
    });
});
