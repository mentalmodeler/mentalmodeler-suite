import { useState } from 'react';
import { SwipeableCarousel } from './SwipeableCarousel';
import PaginationDots from '../PaginationDots/PaginationDots';
import { Flex } from '../IFL/ifl';

export const SwipeableCarouselStateful = ({
    index: initialIndex = 0,
    showPagination = true,
    containerSx = {},
    children,
    ...props
}) => {
    const [index, setIndex] = useState(initialIndex);
    return (
        <Flex
            sx={{
                flexDirection: 'column',
                alignItems: 'center',
                ...containerSx,
            }}
        >
            <SwipeableCarousel
                index={index}
                onChange={(newIndex) => {
                    setIndex(newIndex);
                    props?.onChange && props?.onChange(newIndex);
                }}
                {...props}
            >
                {children}
            </SwipeableCarousel>
            {showPagination && children?.length > 0 && <PaginationDots maxItems={children.length} itemIndex={index} />}
        </Flex>
    );
};
