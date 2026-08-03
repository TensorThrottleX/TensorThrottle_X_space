import React, { useState } from 'react';

export const AdaptiveMediaRenderer = ({ basePath, alt, className }: { basePath: string; alt?: string; className?: string }) => {
    const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
    const [extIndex, setExtIndex] = useState(0);

    return (
        <img
            src={`${basePath}.${extensions[extIndex]}`}
            alt={alt || "Image"}
            className={className}
            decoding="async"
            loading="lazy"
            onError={(e) => {
                if (extIndex < extensions.length - 1) {
                    setExtIndex(extIndex + 1);
                }
            }}
        />
    );
};
