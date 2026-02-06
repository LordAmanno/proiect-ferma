import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Wallet, Sprout, Users, FileText, Bot, Menu, ChevronLeft } from 'lucide-react';
import ChatWidget from './ChatWidget';

export default function Layout() {
  const location = useLocation();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [chatWidth, setChatWidth] = useState(400);
  
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Finance', path: '/finance', icon: Wallet },
    { name: 'Fields & Crops', path: '/crops', icon: Sprout },
    { name: 'Tasks & Labor', path: '/tasks', icon: Users },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const toggleSidebar = () => {
    if (isSidebarOpen) {
      setIsTextVisible(false);
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
      setTimeout(() => setIsTextVisible(true), 200); // Wait for transition
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      <aside 
        className={`bg-white dark:bg-gray-900 shadow-md border-r dark:border-gray-800 flex flex-col z-20 shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between h-[73px]">
          <div className={`overflow-hidden transition-opacity duration-200 ${isTextVisible ? 'opacity-100' : 'opacity-0'}`}>
            {isSidebarOpen && (
              <h1 className="text-xl font-bold text-green-700 dark:text-green-500 truncate">Dashboard</h1>
            )}
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 shrink-0"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                } ${!isSidebarOpen ? 'justify-center px-2' : ''}`}
                title={!isSidebarOpen ? item.name : ''}
              >
                <Icon size={20} className="shrink-0" />
                <span className={`transition-opacity duration-200 ${isTextVisible ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isAssistantOpen
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
            } ${!isSidebarOpen ? 'justify-center px-2' : ''}`}
            title={!isSidebarOpen ? 'Assistant' : ''}
          >
            <Bot size={20} className="shrink-0" />
            <span className={`transition-opacity duration-200 ${isTextVisible ? 'opacity-100' : 'opacity-0 hidden'}`}>
              Assistant
            </span>
          </button>
        </nav>
        
        {isSidebarOpen && <div className="p-4 border-t dark:border-gray-800 space-y-4" />}
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <main 
          className="flex-1 overflow-auto p-8 bg-gray-100 dark:bg-gray-950"
          style={{ marginRight: isAssistantOpen ? `${chatWidth}px` : '0px' }}
        >
          <Outlet />
        </main>
        
        {/* Chat Widget Panel */}
        <ChatWidget 
          isOpen={isAssistantOpen} 
          onClose={() => setIsAssistantOpen(false)} 
          width={chatWidth}
          onResize={setChatWidth}
        />
      </div>
    </div>
  );
}
