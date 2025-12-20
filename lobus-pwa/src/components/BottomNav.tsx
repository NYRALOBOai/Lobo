import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, BrainCircuit, GanttChartSquare, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', icon: <MessageSquare size={24} />, label: 'Chat' },
    { to: '/memory', icon: <BrainCircuit size={24} />, label: 'Memory' },
    { to: '/workspace', icon: <GanttChartSquare size={24} />, label: 'Workspace' },
    { to: '/settings', icon: <Settings size={24} />, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${
                isActive ? 'text-white' : ''
              }`
            }
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
