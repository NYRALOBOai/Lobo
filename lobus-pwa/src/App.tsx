import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import ChatPage from './pages/ChatPage';
import MemoryPage from './pages/MemoryPage';
import WorkspacePage from './pages/WorkspacePage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-gray-900 text-white min-h-screen font-sans">
        <main className="pb-16">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
