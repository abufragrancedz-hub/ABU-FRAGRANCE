import React from 'react';

// Meta and TikTok pixels are now loaded directly in index.html for maximum reliability.
// This provider is kept for any future dynamic tracking needs.
export const TrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};
