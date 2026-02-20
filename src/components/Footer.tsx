import React from 'react';
import { Facebook, Instagram, MessageCircle, Phone, MapPin, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
    const { t, language } = useLanguage();

    return (
        <footer className="bg-primary text-white pt-16 pb-8 mt-auto relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Brand & Social */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <img
                                src="/logo.jpg"
                                alt={t('logoText')}
                                className="h-10 md:h-12 w-auto object-contain rounded-xl"
                            />
                            <h2 className="text-2xl font-bold">{t('logoText')}</h2>
                        </div>
                        <p className="text-gray-400 mb-6">{t('heroSubtitle')}</p>
                        <div className="flex space-x-6">
                            <a href="https://www.facebook.com/profile.php?id=61578060434563" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition transform hover:scale-110"><Facebook /></a>
                            <a href="https://www.instagram.com/abu.fragrancedz?igsh=OXE3aDB6b2p6cnNw" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition transform hover:scale-110"><Instagram /></a>
                            <a href="https://www.tiktok.com/@abu.fragrancedz?_r=1&_t=ZS-93yiQlQFG48" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition transform hover:scale-110">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-tiktok"
                                >
                                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                </svg>
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition transform hover:scale-110"><MessageCircle /></a>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div>
                        <h3 className="text-xl font-bold mb-6 text-accent">{t('contactUsDirectly')}</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-gray-300">
                                <Phone className="text-accent" />
                                <span dir="ltr">+213 778 05 70 76</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-300">
                                <MapPin className="text-accent" />
                                <span>zniket learayes el casbah, Algiers, Algeria</span>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div>
                        <h3 className="text-xl font-bold mb-6 text-accent">{t('ourLocation')}</h3>
                        <div className="rounded-xl overflow-hidden h-48 border border-white/10 shadow-lg relative bg-gray-800 flex items-center justify-center group">
                            {/* Map Facade (Load on click) */}
                            <div
                                className="absolute inset-0 bg-cover opacity-30 group-hover:opacity-40 transition-opacity"
                                style={{ backgroundImage: 'linear-gradient(to bottom right, #2C2C2C, #1A1A1A)' }}
                            ></div>

                            <button
                                onClick={(e) => {
                                    const container = e.currentTarget.parentElement;
                                    if (container) {
                                        container.innerHTML = `<iframe 
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123169.49153503789!2d2.8573694126446205!3d36.69354962008073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128fb3003d14dd17%3A0x49e7e9b35606453b!2z2KPYqNmIINin2YTYudi32YjYsQ!5e1!3m2!1sen!2sdz!4v1771095547970!5m2!1sen!2sdz" 
                                            width="100%" 
                                            height="100%" 
                                            style="border:0;" 
                                            allowfullscreen="" 
                                            loading="lazy" 
                                            referrerpolicy="no-referrer-when-downgrade">
                                        </iframe>`;
                                    }
                                }}
                                className="relative z-10 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-white font-bold transition-all flex items-center gap-2 group-hover:scale-105"
                            >
                                <MapPin className="w-4 h-4 text-accent" />
                                {t('ourLocation')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* WhatsApp CTA - Between map and copyright */}
                <div className="flex items-center gap-2 py-6 justify-center md:justify-start">
                    <a
                        href="https://wa.me/213778057076"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-green-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg hover:bg-green-600 transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
                        aria-label={t('contactUsDirectly')}
                    >
                        <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                    </a>

                    <div className="flex items-center gap-0 animate-bounce-slow">
                        {/* Curved Arrow SVG */}
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`text-green-400 flex-shrink-0 ${language === 'ar' ? 'scale-x-[-1]' : ''}`}
                        >
                            <path
                                d="M28 4C20 4 12 8 10 18L6 14"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M10 18L14 14"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div className="bg-green-500 text-white text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                            {t('whatsappCta')}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} {t('logoText')}. {t('footerText')} | Developed By <a href="https://zedlink.netlify.app" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline"> <strong>ZED-LINK Solution.</strong></a>
                </div>
            </div>
        </footer>
    );
};
