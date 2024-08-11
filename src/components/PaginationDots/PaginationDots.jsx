import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { Flex } from '../IFL/ifl';

function PaginationDots({ maxItems, itemIndex, transitionDuration }) {
    let paginationOffset = 0;

    if (itemIndex > 2 && itemIndex + 4 <= maxItems) {
        paginationOffset = -12 * (itemIndex - 2);
    } else if (itemIndex > 3) {
        paginationOffset = -12 * (maxItems - 5);
    }

    return (
        <Flex
            sx={{
                position: 'relative',
                alignTtems: 'center',
                width: '60px',
                height: '12px',
                overflow: 'hidden',
            }}
        >
            <Flex
                sx={{
                    position: 'absolute',
                    transform: `translateX(${paginationOffset}px)`,
                    transition: `transform ${transitionDuration}ms ease-out`,
                }}
            >
                {Array(maxItems)
                    .fill()
                    .map((item, i) => {
                        return (
                            <Box
                                key={`p-d-${i}`}
                                sx={{
                                    content: "''",
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    marginBlock: 0,
                                    marginInline: '2px',
                                    backgroundColor: '#000',
                                    opacity: itemIndex === i ? 1 : 0.3,
                                    transformOrigin: 'center',
                                    transform: `scale(${itemIndex === i ? 1 : 0.75})`,
                                    transition: `background-color ${transitionDuration}ms ease-out, transform ${transitionDuration}ms ease-out`,
                                }}
                            />
                        );
                    })}
            </Flex>
        </Flex>
    );
}

PaginationDots.propTypes = {
    /* The number of images in this set */
    maxItems: PropTypes.number,
    /* The current index that the pagination dots should be set to */
    itemIndex: PropTypes.number,
    /** The transition duration (in milliseconds) when moving from one image index to the next or previous. Transistion occurs after click or pan. */
    transitionDuration: PropTypes.number,
};

PaginationDots.defaultProps = {
    maxItems: 0,
    itemIndex: 0,
    transitionDuration: 250,
};

export default PaginationDots;
