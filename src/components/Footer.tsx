import React from 'react';
import { Facebook, Instagram, MessageCircle, Phone, MapPin, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
    const { t } = useLanguage();

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
                                className="h-10 md:h-12 w-auto object-contain brightness-0 invert"
                            />
                            <h2 className="text-2xl font-bold">{t('logoText')}</h2>
                        </div>
                        <p className="text-gray-400 mb-6">{t('heroSubtitle')}</p>
                        <div className="flex space-x-6">
                            <a href="#" className="hover:text-accent transition transform hover:scale-110"><Facebook /></a>
                            <a href="#" className="hover:text-accent transition transform hover:scale-110"><Instagram /></a>
                            <a href="#" className="hover:text-accent transition transform hover:scale-110">
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
                            <a href="#" className="hover:text-accent transition transform hover:scale-110"><MessageCircle /></a>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div>
                        <h3 className="text-xl font-bold mb-6 text-accent">{t('contactUsDirectly')}</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-gray-300">
                                <Phone className="text-accent" />
                                <span dir="ltr">+213 770 63 77 64</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-300">
                                <Mail className="text-accent" />
                                <span>contact@dz-shop.com</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-300">
                                <MapPin className="text-accent" />
                                <span>123 Street Name, Algiers, Algeria</span>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div>
                        <h3 className="text-xl font-bold mb-6 text-accent">{t('ourLocation')}</h3>
                        <div className="rounded-xl overflow-hidden h-48 border border-white/10 shadow-lg">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d102286.38396696374!2d3.0419736499999997!3d36.7597397!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128fb2ea3b49752f%3A0x34e8e5237616a97c!2sAlgiers!5e0!3m2!1sen!2sdz!4v1700000000000!5m2!1sen!2sdz"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} {t('logoText')}. {t('footerText')} | Developed By <a href="https://zedlink.netlify.app" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline"> <strong>ZED-LINK Solution.</strong></a>
                </div>

                {/* WhatsApp Button - Static in Footer */}
                <a
                    href="https://wa.me/213770637764"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-20 left-4 md:left-8 flex items-center justify-center bg-green-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg hover:bg-green-600 transition-transform hover:scale-105 active:scale-95"
                    aria-label={t('contactUsDirectly')}
                >
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                </a>
            </div>
        </footer>
    );
};
