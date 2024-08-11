import { useState } from 'react';
// import { Flex, Text, Heading, Box, RadioButtonGroup, Button, Card } from '@indeed/ifl-components';
import { ExpandableTransition } from './ExpandableTransition';
import { Flex, Heading, Text } from '../IFL/ifl';
import { Box, Card } from '@mui/material';

const items =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?'
        .split('. ')
        .map((item) => {
            const contents = item.split(' ');
            const sliceIndex = 3 + Math.round(Math.random() * 3);
            return {
                title: contents.slice(0, sliceIndex).join(' '),
                content: contents.slice(sliceIndex).join(' '),
            };
        })
        .slice(0, 6);

export const ExpandableTransitionDemo = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    return (
        <Box
            sx={{
                p: 6,
                pt: 0,
                maxWidth: '992px',
                mx: 'auto',
            }}
        >
            <Box
                sx={{
                    bg: 'neutral.0',
                    p: 4,
                    position: 'sticky',
                    top: '0',
                    borderBlockEnd: '1px solid',
                    borderColor: 'neutral.500',
                }}
            >
                {/* <RadioButtonGroup
                    name="controlled-example"
                    value={isExpanded ? 'Expanded' : 'Collapsed'}
                    legend={'Choose an option'}
                    onChange={({ target }) => setIsExpanded(target.value === 'Expanded')}
                >
                    <Button value={'Expanded'}>{'Expanded'}</Button>
                    <Button value={'Collapsed'}>{'Collapsed'}</Button>
                </RadioButtonGroup> */}
            </Box>
            <ExpandableTransition isExpanded={isExpanded}>
                <Flex
                    sx={{
                        rowGap: 4,
                        flexDirection: 'column',
                        p: 6,
                        bg: 'neutral.200',
                    }}
                >
                    {items.map(({ title, content }) => (
                        <Card key={title} sx={{ bg: 'neutral.0' }}>
                            <Heading level={4}>{title}</Heading>
                            <Text>{content}</Text>
                        </Card>
                    ))}
                </Flex>
            </ExpandableTransition>
        </Box>
    );
};
