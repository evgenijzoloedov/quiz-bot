import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  LayoutDashboard, 
  Users, 
  HelpCircle, 
  BarChart3, 
  FolderOpen,
  LogOut,
  Bot,
  FileText,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/names', icon: Users, label: 'Имена' },
  { to: '/quiz', icon: Video, label: 'Квиз' },
  { to: '/quiz-builder', icon: HelpCircle, label: 'Вопросы' },
  { to: '/fail-images', icon: ImageIcon, label: 'Картинки ошибок' },
  { to: '/analytics', icon: BarChart3, label: 'Аналитика' },
  { to: '/files', icon: FolderOpen, label: 'Файлы' },
];

export const Sidebar: React.FC = () => {
  const { admin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0a0a0f] border-r border-[#1a1a24] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#1a1a24]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[#f0f0f5]">Quiz Bot</h1>
            <p className="text-xs text-[#606070]">CRM Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              'text-sm font-medium',
              isActive
                ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                : 'text-[#a0a0b0] hover:text-[#f0f0f5] hover:bg-[#12121a]'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-[#1a1a24]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {admin?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#f0f0f5] truncate">
                {admin?.name || 'Admin'}
              </p>
              <p className="text-xs text-[#606070]">
                ID: {admin?.telegramId}
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
};

