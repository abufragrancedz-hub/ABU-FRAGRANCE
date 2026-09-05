import React from 'react';
import { getOptimizedImageUrl } from '../utils/cloudinary';

interface OptimizeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    loading?: 'lazy' | 'eager';
    fetchPriority?: 'high' | 'low' | 'auto';
}

export const OptimizeImage: React.FC<OptimizeImageProps> = ({
    src,
    alt,
    width,
    height,
    className,
    loading = 'lazy',
    fetchPriority = 'auto',
    ...props
}) => {
    // Generate optimized URL for the main src
    const optimizedSrc = getOptimizedImageUrl(src, width, height);

    // Generate responsive srcset
    // Mobile: 400px, 600px, Tablet: 800px, Desktop: 1200px
    const generateSrcSet = () => {
        if (!src || !src.includes('cloudinary.com')) return undefined;
        
        const sizesArr = [300, 400, 600, 800, 1200];
        return sizesArr
            .map(s => {
                // Determine heights proportionally if generating different widths
                let genHeight = undefined;
                if (width && height) {
                    genHeight = Math.round((s / width) * height);
                }
                return `${getOptimizedImageUrl(src, s, genHeight)} ${s}w`;
            })
            .join(', ');
    };

    const srcSet = generateSrcSet();
    const sizes = props.sizes || "(max-width: 600px) 600px, (max-width: 800px) 800px, 1200px";

    return (
        <img
            src={optimizedSrc}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            // @ts-ignore - React handles fetchPriority in 18.2+, but for older/native support we use lowercase
            fetchpriority={fetchPriority}
            className={className}
            style={{ 
                aspectRatio: width && height ? `${width}/${height}` : 'auto', 
                objectFit: 'cover',
                ...props.style as React.CSSProperties
            }}
            {...props}
        />
    );
};
