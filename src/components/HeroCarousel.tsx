import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const getCloudinaryUrl = (path: string) => {
    // Return the raw Cloudinary URL. OptimizeImage component will add f_auto/q_auto safely.
    if (CLOUD_NAME) {
        // Path should be like 'carousel/lahab.png'
        return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${path}`;
    }
    // Fallback to local image
    return `/images/${path}`;
};

const fragrances = [
    {
        id: 1,
        name: "Hersh Lahab",
        image: getCloudinaryUrl("lahab_jeixvj.png")
    },
    {
        id: 2,
        name: "Venom Incarnat",
        image: getCloudinaryUrl("venom_ecuh7b.png")
    },
    {
        id: 3,
        name: "Amouage Guidance",
        image: getCloudinaryUrl("amouage_fbodoa.png")
    },
    {
        id: 4,
        name: "LV Fantasmagory",
        image: getCloudinaryUrl("lv_cgmvwk.png")
    },
    {
        id: 5,
        name: "God of Fire",
        image: getCloudinaryUrl("god_of_fire_tbeqak.png")
    }
];

export const HeroCarousel: React.FC = () => {
    const { t, language } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % fragrances.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % fragrances.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + fragrances.length) % fragrances.length);
    };

    return (
        <div className="relative w-full h-[75vh] md:h-[85vh] min-h-[500px] overflow-hidden bg-gray-950" style={{ minHeight: '500px', height: '75vh' }}>
            {/* Reserve space for images to prevent CLS */}
            <div className="absolute inset-0 bg-gray-900" aria-hidden="true" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={currentIndex === 0 ? false : { opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <img
                        src={(() => {
                            const cloudMatch = fragrances[currentIndex].image.split('image/upload/');
                            if(cloudMatch.length === 2) return `https://res.cloudinary.com/dsluz70xf/image/upload/f_auto,q_auto:eco,dpr_auto,w_1200,c_fill/${cloudMatch[1]}`;
                            return fragrances[currentIndex].image;
                        })()}
                        srcSet={(() => {
                            const cloudMatch = fragrances[currentIndex].image.split('image/upload/');
                            if(cloudMatch.length === 2) {
                                const base = `https://res.cloudinary.com/dsluz70xf/image/upload/f_auto,q_auto:eco,dpr_auto`;
                                return `${base},w_600,c_fill/${cloudMatch[1]} 600w, ${base},w_800,c_fill/${cloudMatch[1]} 800w, ${base},w_1200,c_fill/${cloudMatch[1]} 1200w`;
                            }
                            return undefined;
                        })()}
                        sizes="(max-width: 600px) 600px, (max-width: 800px) 800px, 1200px"
                        alt={fragrances[currentIndex].name}
                        className="w-full h-full object-cover opacity-100"
                        loading={currentIndex === 0 ? "eager" : "lazy"}
                        // @ts-ignore
                        fetchpriority={currentIndex === 0 ? "high" : "auto"}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Content removed per user request */}

            {/* Navigation Buttons */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex justify-between px-4 md:px-8 pointer-events-none">
                <button
                    onClick={prevSlide}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl transition-all border border-white/5 pointer-events-auto active:scale-95 group"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
                <button
                    onClick={nextSlide}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl transition-all border border-white/5 pointer-events-auto active:scale-95 group"
                    aria-label="Next slide"
                >
                    <ChevronRight className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Buy Now Button */}
            <div className="absolute bottom-20 md:bottom-28 left-1/2 -translate-x-1/2 z-30 w-full px-4 flex justify-center">
                {currentIndex === 0 ? (
                    <button
                        onClick={() => {
                            const element = document.getElementById('products');
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="group bg-primary text-white px-10 md:px-16 py-4 md:py-6 rounded-2xl font-black text-lg md:text-2xl shadow-2xl shadow-primary/40 uppercase tracking-[0.2em] border-2 border-primary hover:bg-black hover:border-black transition-all flex items-center gap-4 backdrop-blur-sm active:shadow-none"
                    >
                        <span>{t('buyNow')}</span>
                        <ChevronRight className={`w-5 h-5 md:w-6 md:h-6 rotate-90 transform ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
                    </button>
                ) : (
                    <motion.button
                        key="buy-now-motion"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.8 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            const element = document.getElementById('products');
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="group bg-primary text-white px-10 md:px-16 py-4 md:py-6 rounded-2xl font-black text-lg md:text-2xl shadow-2xl shadow-primary/40 uppercase tracking-[0.2em] border-2 border-primary hover:bg-black hover:border-black transition-all flex items-center gap-4 backdrop-blur-sm active:shadow-none"
                    >
                        <span>{t('buyNow')}</span>
                        <motion.div
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ChevronRight className={`w-5 h-5 md:w-6 md:h-6 rotate-90 transform ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
                        </motion.div>
                    </motion.button>
                )}
            </div>

            {/* Indicators */}
            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-2">
                {fragrances.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className="p-3 sm:p-4 group"
                        aria-label={`Go to slide ${index + 1}`}
                    >
                        <div className={`transition-all duration-500 rounded-full ${index === currentIndex ? 'bg-primary w-12 h-2 sm:h-2.5 shadow-lg shadow-primary/50' : 'bg-white/20 group-hover:bg-white/40 w-2 h-2 sm:w-2.5 sm:h-2.5'
                            }`} />
                    </button>
                ))}
            </div>
        </div>
    );
};
