import React from 'react';

export const findChild = (children, type) =>
    React.Children.map(children, (child) => (child && child.type === type ? child : null)).find((child) => !!child);

// export const filterChildren = (children, type) =>
//     React.Children.map(children, (child) => (child && child.type === type ? child : null)).find((child) => !!child);
