import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh-HK', name: '繁體中文' },
    { code: 'zh-CN', name: '简体中文' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <Languages className="h-4 w-4 text-gray-600" />
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer text-gray-600"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;