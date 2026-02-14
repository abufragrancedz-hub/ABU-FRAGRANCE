import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const fragrances = [
    {
        id: 1,
        name: "Royal Oud",
        image: "https://fimgs.net/mdimg/perfume/social.10886.jpg"
    },
    {
        id: 2,
        name: "Midnight Rose",
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=2000&auto=format&fit=crop"
    },
    {
        id: 3,
        name: "Golden Amber",
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2000&auto=format&fit=crop"
    },
    {
        id: 4,
        name: "Ocean Breeze",
        image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?q=80&w=2000&auto=format&fit=crop"
    },
    {
        id: 5,
        name: "Velvet Musk",
        image: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=2000&auto=format&fit=crop"
    },
    {
        id: 6,
        name: "Spiced Wood",
        image: "https://noseparis.com/media/nose/media/MFK_slider_desktop.png"
    },
    {
        id: 7,
        name: "Pure Jasmine",
        image: "https://fimgs.net/mdimg/perfume/social.64947.jpg"
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
        <div className="relative w-full h-[75vh] md:h-[85vh] overflow-hidden bg-gray-950">
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-gray-900/60 via-transparent to-gray-900" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <img
                        src={fragrances[currentIndex].image}
                        alt={fragrances[currentIndex].name}
                        className="w-full h-full object-cover opacity-70"
                    />
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
                <motion.div
                    key={`content-${currentIndex}`}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="max-w-4xl space-y-6"
                >
                    <div className="inline-block px-4 py-2 bg-primary/20 backdrop-blur-md rounded-full text-white font-black text-xs uppercase tracking-[0.3em] mb-4 border border-white/10">
                        {t('exclusive')}
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl">
                        {t('heroTitle')}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/70 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                        {t('heroSubtitle')}
                    </p>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="bg-primary text-white text-lg font-black px-12 py-5 rounded-2xl pointer-events-auto shadow-2xl shadow-primary/40 hover:bg-black hover:shadow-black/20 transition-all uppercase tracking-widest"
                        onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        {t('shopNow')}
                    </motion.button>
                </motion.div>
            </div>

            {/* Navigation Buttons */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex justify-between px-4 md:px-8 pointer-events-none">
                <button
                    onClick={prevSlide}
                    className="p-4 rounded-3xl bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl transition-all border border-white/5 pointer-events-auto active:scale-95 group"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className={`w-8 h-8 group-hover:scale-110 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
                <button
                    onClick={nextSlide}
                    className="p-4 rounded-3xl bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl transition-all border border-white/5 pointer-events-auto active:scale-95 group"
                    aria-label="Next slide"
                >
                    <ChevronRight className={`w-8 h-8 group-hover:scale-110 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3">
                {fragrances.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`transition-all duration-500 rounded-full ${index === currentIndex ? 'bg-primary w-12 h-2.5 shadow-lg shadow-primary/50' : 'bg-white/20 hover:bg-white/40 w-2.5 h-2.5'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};
