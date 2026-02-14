import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Globe className="w-4 h-4 text-gray-600" />
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'ar' | 'en' | 'fr')}
                className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
            >
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
            </select>
        </div>
    );
};
