import React from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-6">
        <Dashboard />
      </main>
      <footer className="bg-white py-4 px-6 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex justify-center items-center space-x-4">
          <p>Data source: <a href="https://www.immd.gov.hk/hks/facts/passenger-statistics-menu.html" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Immigration Department, Hong Kong</a></p>
          <span>|</span>
          <p>Source code: <a href="https://github.com/jy5275/hk-immigration-website" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">GitHub</a></p>
        </div>
      </footer>
    </div>
  );
}

export default App;