import React from 'react';
import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800">{t('title')}</h1>
        </div>
        <div className="flex items-center space-x-6">
          <LanguageSwitcher />
          <div className="text-sm text-gray-600">
            <span>2020 - {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;