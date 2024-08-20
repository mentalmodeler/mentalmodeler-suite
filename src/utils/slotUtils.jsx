import React from 'react';

export const findChild = (children, type) =>
    React.Children.map(children, (child) => (child && child.type === type ? child : null)).find((child) => !!child);

export const DialogBaseTitle = ({ children }) => {
    return children || null;
};

export const DialogBaseContent = ({ children }) => {
    return children || null;
};

export const DialogBaseActions = ({ children }) => {
    return children || null;
};

export const DialogBaseTitleType = (<DialogBaseTitle />).type;
export const DialogBaseContentType = (<DialogBaseContent />).type;
export const DialogBaseActionsType = (<DialogBaseActions />).type;
