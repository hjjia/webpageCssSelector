import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Popup from './components/popup/Popup';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <div className="min-h-screen bg-gray-50">
        <Popup />
      </div>
    </I18nextProvider>
  );
}

export default App;
