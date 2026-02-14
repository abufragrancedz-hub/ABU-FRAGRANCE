import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll window to top
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        // Also scroll any fixed containers that might have overflow
        const scrollContainers = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
        scrollContainers.forEach(container => {
            container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        });

        // Specific scroll for the main layout container
        const mainContainer = document.querySelector('.fixed.inset-0.overflow-y-auto');
        if (mainContainer) {
            mainContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    }, [pathname]);

    return null;
};
