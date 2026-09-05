const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Cloudinary Error Detail:', errorData);
            throw new Error(`Failed to upload image: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};
 
 export const getOptimizedImageUrl = (url: string, width?: number, height?: number, crop: 'fill' | 'scale' = 'fill'): string => {
     if (!url || !url.includes('cloudinary.com')) return url;
 
     // If URL already has transformations, we need to be careful.
     // Standard Cloudinary URL: https://res.cloudinary.com/<cloud_name>/image/upload/v123456789/<public_id>
     const uploadPart = '/upload/';
     const uploadIndex = url.indexOf(uploadPart);
     
     if (uploadIndex === -1) return url;
 
     const baseUrl = url.substring(0, uploadIndex + uploadPart.length);
     const imagePath = url.substring(uploadIndex + uploadPart.length);
 
     // If the URL already has transformations (contains key params), skip adding more
     if (imagePath.includes('f_auto') || imagePath.includes('q_auto')) {
         return url;
     }

     const params = ['f_auto', 'q_auto:eco', 'dpr_auto'];
     if (width) params.push(`w_${width}`);
     if (height) params.push(`h_${height}`);
     params.push(`c_${crop}`);
 
     return `${baseUrl}${params.join(',')}/${imagePath}`;
 };
 
 export interface CloudinaryImageParams {
     width?: number;
     height?: number;
     crop?: 'fill' | 'scale';
 }

