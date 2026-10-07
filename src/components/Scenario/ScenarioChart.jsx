import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

const DEFAULT_CHART_HEIGHT = 320;
const MARGIN = { top: 24, right: 16, bottom: 130, left: 48 };
const MIN_CADENCE = 28;
// Caps how far bars spread out when the container is wide and there are few
// of them -- without this, a handful of bars stretch to fill all available
// width, leaving them stranded far apart from each other.
const MAX_CADENCE = 64;
const MIN_BAR_WIDTH = 8;
const MAX_BAR_WIDTH = 24;
// Labels are truncated to this many cadences of width. Must fit within the
// bottom margin once rotated -45deg (width * sin45 <= MARGIN.bottom - 12).
const LABEL_BUDGET_FACTOR = 2;
// A label truncated to fit that budget swings this fraction of a
// cadence horizontally once rotated -45deg -- shared by the cadence-fit
// calculation and the left/right pad so the two never disagree.
const LABEL_PAD_FACTOR = LABEL_BUDGET_FACTOR * Math.cos(Math.PI / 4);
const LABEL_FONT_SIZE = 11;
const LABEL_FONT = `${LABEL_FONT_SIZE}px Roboto, "Helvetica", "Arial", sans-serif`;
const POSITIVE_COLOR = '#2a78d6';
const NEGATIVE_COLOR = '#e34948';
const AXIS_COLOR = '#0b0b0b';
const GRID_COLOR = '#e1e0d9';
const TEXT_COLOR = '#52514e';
const RADIUS = 4;

// A single offscreen canvas, reused across measurements rather than
// recreated per label.
let measureCanvas;
const measureTextWidth = (text) => {
    if (!measureCanvas) {
        measureCanvas = document.createElement('canvas');
    }
    const ctx = measureCanvas.getContext('2d');
    ctx.font = LABEL_FONT;
    return ctx.measureText(text).width;
};

// Shortens a label to fit maxWidth with an ellipsis, rather than forcing
// every bar's spacing wider to make room for the single longest name.
const truncateLabel = (text, maxWidth) => {
    if (measureTextWidth(text) <= maxWidth) {
        return text;
    }
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        const candidate = `${text.slice(0, mid)}…`;
        if (measureTextWidth(candidate) <= maxWidth) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    return lo === 0 ? '…' : `${text.slice(0, lo)}…`;
};

// A rounded-tip, square-baseline bar: a plain SVG rect can't round only two
// corners, so this draws the outline as a path instead.
const roundedBarPath = (x, width, yBase, yTip) => {
    const barHeight = Math.abs(yTip - yBase);
    const r = Math.min(RADIUS, barHeight / 2, width / 2);
    if (yTip <= yBase) {
        return `M ${x + r} ${yTip}
                L ${x + width - r} ${yTip}
                Q ${x + width} ${yTip} ${x + width} ${yTip + r}
                L ${x + width} ${yBase}
                L ${x} ${yBase}
                L ${x} ${yTip + r}
                Q ${x} ${yTip} ${x + r} ${yTip}
                Z`;
    }
    return `M ${x} ${yBase}
            L ${x} ${yTip - r}
            Q ${x} ${yTip} ${x + r} ${yTip}
            L ${x + width - r} ${yTip}
            Q ${x + width} ${yTip} ${x + width} ${yTip - r}
            L ${x + width} ${yBase}
            Z`;
};

const niceTicks = (min, max, count = 4) => {
    if (min === max) {
        return [min];
    }
    const step = (max - min) / count;
    return Array.from({ length: count + 1 }, (_, i) => min + step * i);
};

// Picks a display precision from the tick spread itself, so a chart full of
// tiny deltas doesn't render ticks as long, overlapping decimal strings.
const formatTick = (value, spread) => {
    if (value === 0) {
        return '0';
    }
    const decimals = spread > 0 && spread < 1 ? Math.min(6, Math.ceil(-Math.log10(spread)) + 1) : 2;
    return value.toFixed(decimals).replace(/\.?0+$/, '') || '0';
};

// A diverging (blue=increase / red=decrease) bar chart for the per-concept
// deltas Scenario.jsx already computes. Sign is encoded twice over (bar
// direction from the zero baseline, and color) so color is reinforcement,
// never the only signal.
export const ScenarioChart = ({ data = [] }) => {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === 'undefined') {
            return undefined;
        }
        const measure = () => {
            const rect = el.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        };
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        // CSS-in-JS styles can finish inserting a frame or two after mount,
        // so the title above this box can still be at a transient height
        // when the very first measurement (ResizeObserver's initial
        // callback, or a same-frame rAF) runs -- with no further box resize
        // afterward, nothing corrects that stale number. A short delayed
        // re-check, after styles have had time to settle, catches it.
        const raf = requestAnimationFrame(measure);
        const timeout = setTimeout(measure, 100);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(raf);
            clearTimeout(timeout);
        };
    }, []);

    const chartHeight = containerSize.height || DEFAULT_CHART_HEIGHT;
    const plotHeight = Math.max(80, chartHeight - MARGIN.top - MARGIN.bottom);

    // Bars spread out to fill the available container width up to a cap, so
    // a handful of bars in a wide container don't end up stranded far apart;
    // once they'd get too thin, cadence holds at the minimum and the outer
    // container scrolls instead. Driven purely by bar count and container
    // size -- a long concept name doesn't force every bar's spacing wider,
    // since labels are truncated to fit their own slot instead (below).
    //
    // svgWidth works out to MARGIN.left + MARGIN.right + cadence * (n + 2 *
    // LABEL_PAD_FACTOR) once labelPad (below) is folded in, so that same
    // factor has to appear here too -- otherwise this "fits the container"
    // cadence and the actual rendered width disagree, and the chart ends up
    // wider than the container (an unwanted scrollbar) even though nothing
    // visible needed more room.
    const cadence = useMemo(() => {
        if (data.length === 0) {
            return MIN_CADENCE;
        }
        const available = containerSize.width - MARGIN.left - MARGIN.right;
        const fitCadence = Math.min(available / (data.length + 2 * LABEL_PAD_FACTOR), MAX_CADENCE);
        return Math.max(MIN_CADENCE, fitCadence);
    }, [data.length, containerSize.width]);

    // Room for the first/last bar's rotated label to swing past the plot's
    // own edge, bounded by the same per-slot budget truncation uses below.
    const labelPad = cadence * LABEL_PAD_FACTOR;
    const barWidth = Math.min(MAX_BAR_WIDTH, Math.max(MIN_BAR_WIDTH, cadence * 0.7));
    const plotWidth = cadence * data.length;
    const svgWidth = MARGIN.left + labelPad + MARGIN.right + labelPad + plotWidth;

    const { yScale, ticks, tickSpread } = useMemo(() => {
        const values = data.map((d) => d.value);
        let min = Math.min(0, ...values);
        let max = Math.max(0, ...values);
        if (min === max) {
            min -= 1;
            max += 1;
        }
        const scale = (v) => plotHeight - ((v - min) / (max - min)) * plotHeight;
        return { yScale: scale, ticks: niceTicks(min, max), tickSpread: max - min };
    }, [data, plotHeight]);

    const yBase = yScale(0);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ padding: 1, flex: '0 0 auto' }}>
                Scenario effect — change from baseline
            </Typography>
            {/* containerRef stays on this one box across every render, data-empty or
                not -- a ref that swapped to a different node per branch left the
                ResizeObserver (attached once, on mount) permanently bound to whichever
                node happened to render first. Sized purely by flex layout, with no
                overflow of its own, so the scrollbars on the absolutely-positioned box
                below can never feed back into the size this component measures. */}
            <Box ref={containerRef} sx={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}>
                {data.length === 0 ? (
                    <Box sx={{ padding: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            No scenario effects to chart yet.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ position: 'absolute', inset: 0, overflow: 'auto', overscrollBehavior: 'none' }}>
                        <svg
                            width={svgWidth}
                            height={chartHeight}
                            style={{ display: 'block' }}
                            role="img"
                            aria-label="Scenario effect bar chart"
                        >
                            <style>
                                {
                                    '.mm-scenario-bar:hover path, .mm-scenario-bar:focus-visible path { opacity: 0.85; } .mm-scenario-bar { outline: none; }'
                                }
                            </style>
                            <g transform={`translate(${MARGIN.left + labelPad}, ${MARGIN.top})`}>
                                <rect width={plotWidth} height={plotHeight} fill="#ffffff" />
                                {ticks.map((tick) => (
                                    <g key={tick}>
                                        <line
                                            x1={0}
                                            x2={plotWidth}
                                            y1={yScale(tick)}
                                            y2={yScale(tick)}
                                            stroke={GRID_COLOR}
                                            strokeWidth={1}
                                        />
                                        <text
                                            x={-8}
                                            y={yScale(tick)}
                                            dy="0.32em"
                                            textAnchor="end"
                                            fontSize={LABEL_FONT_SIZE}
                                            fill={TEXT_COLOR}
                                        >
                                            {formatTick(tick, tickSpread)}
                                        </text>
                                    </g>
                                ))}
                                {/* Dedicated zero baseline — drawn separately from the evenly-spaced
                            ticks above, since those rarely land exactly on 0 once the data
                            spans both positive and negative values. */}
                                <line x1={0} x2={plotWidth} y1={yBase} y2={yBase} stroke={AXIS_COLOR} strokeWidth={2} />
                                <text
                                    x={-8}
                                    y={yBase}
                                    dy="0.32em"
                                    textAnchor="end"
                                    fontSize={LABEL_FONT_SIZE}
                                    fill={TEXT_COLOR}
                                >
                                    0
                                </text>
                                {data.map((d, i) => {
                                    const x = i * cadence + (cadence - barWidth) / 2;
                                    const yTip = yScale(d.value);
                                    const color = d.value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR;
                                    const valueLabel = formatTick(d.value, Math.abs(d.value) || 1);
                                    const axisLabel = truncateLabel(d.name, cadence * LABEL_BUDGET_FACTOR);
                                    return (
                                        <Tooltip key={d.id} title={`${d.name}: ${valueLabel}`}>
                                            <g
                                                tabIndex={0}
                                                role="img"
                                                aria-label={`${d.name}: ${valueLabel}`}
                                                className="mm-scenario-bar"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <path d={roundedBarPath(x, barWidth, yBase, yTip)} fill={color} />
                                                <text
                                                    x={x + barWidth / 2}
                                                    y={plotHeight + 12}
                                                    textAnchor="end"
                                                    fontSize={LABEL_FONT_SIZE}
                                                    fill={TEXT_COLOR}
                                                    transform={`rotate(-45, ${x + barWidth / 2}, ${plotHeight + 12})`}
                                                >
                                                    {axisLabel}
                                                </text>
                                            </g>
                                        </Tooltip>
                                    );
                                })}
                            </g>
                        </svg>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
