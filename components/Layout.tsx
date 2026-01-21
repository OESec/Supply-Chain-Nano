
import React, { useState } from 'react';
import { LayoutDashboard, Users, Map, Bell, Settings, ShieldCheck, Menu, HelpCircle, X, Zap, Lock, Globe, Activity, ArrowRight, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  alertCount: number;
  vendorCount: number;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, alertCount, vendorCount, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Vendors', icon: Users, path: '/vendors', badge: vendorCount > 0 ? vendorCount : undefined },
    { name: 'Supply Chain Map', icon: Map, path: '/map' },
    { name: 'Alerts', icon: Bell, path: '/alerts', badge: alertCount > 0 ? alertCount : undefined },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Format current date for display
  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-slate-900 border-r border-slate-800 text-white shadow-xl transition-all duration-300">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">RiskGuard AI</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all group ${
                isActive(item.path) 
                  ? 'bg-white/10 text-white shadow-none ring-1 ring-white/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          
          {/* About Button in Navigation */}
           <button
              onClick={() => setIsAboutModalOpen(true)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all group text-slate-400 hover:text-white hover:bg-white/5 text-left"
            >
              <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-white" />
              <span className="font-medium">About Platform</span>
            </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <button 
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-medium flex items-center">
              {darkMode ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
            <div className={`w-8 h-4 bg-slate-700 rounded-full relative transition-colors ${darkMode ? 'bg-indigo-500' : ''}`}>
               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${darkMode ? 'left-4.5' : 'left-0.5'}`} style={{left: darkMode ? '18px' : '2px'}}></div>
            </div>
          </button>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Plan</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white font-mono text-[10px] opacity-50">SME Standard</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 flex items-center justify-between p-4 shadow-md border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg">RiskGuard AI</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900 z-40 pt-20 px-4 md:hidden">
           <nav className="space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-4 rounded-lg text-lg ${
                  isActive(item.path) 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span>{item.name}</span>
              </Link>
            ))}
             <button
                onClick={() => { toggleDarkMode(); }}
                className="w-full flex items-center space-x-3 px-4 py-4 rounded-lg text-lg text-slate-300"
              >
                {darkMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
             <button
                onClick={() => { setIsAboutModalOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center space-x-3 px-4 py-4 rounded-lg text-lg text-slate-300"
              >
                <HelpCircle className="w-6 h-6" />
                <span>About Platform</span>
              </button>
           </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 flex flex-col">
        <div className="flex-1 max-w-7xl mx-auto p-4 md:p-8 w-full">
          {children}
        </div>
        
        {/* Footer with Generation Date */}
        <footer className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 mt-auto border-t border-gray-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500 text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>&copy; {new Date().getFullYear()} RiskGuard AI. All rights reserved.</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-600">
              Platform active: <span className="font-semibold text-slate-700 dark:text-slate-400">{currentDate}</span>
            </div>
          </div>
        </footer>
      </main>

      {/* About Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl px-8 pb-8 pt-16 text-white shadow-2xl max-w-5xl w-full relative overflow-y-auto max-h-[90vh] ring-1 ring-white/10">
            <button 
              onClick={() => setIsAboutModalOpen(false)} 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                  <h2 className="text-3xl font-bold mb-4">Why RiskGuard AI?</h2>
                  <p className="text-slate-300 mb-6 text-lg leading-relaxed">
                      In today's volatile global market, blindness is a business risk you can't afford. 
                      RiskGuard AI brings <strong>Fortune 500-level supply chain intelligence</strong> to SMEs 
                      without the enterprise price tag or complex integration.
                  </p>
                  <div className="space-y-4">
                      <div className="flex items-start">
                          <div className="bg-indigo-500/20 p-2 rounded-lg mr-4">
                              <Zap className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                              <h4 className="font-semibold text-white">Instant AI Analysis</h4>
                              <p className="text-sm text-slate-400">Get comprehensive risk scores in seconds using advanced generative AI.</p>
                          </div>
                      </div>
                      <div className="flex items-start">
                          <div className="bg-indigo-500/20 p-2 rounded-lg mr-4">
                              <Lock className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                              <h4 className="font-semibold text-white">Standalone Security</h4>
                              <p className="text-sm text-slate-400">No intrusive ERP integration required. Start protecting your supply chain today.</p>
                          </div>
                      </div>
                      <div className="flex items-start">
                          <div className="bg-indigo-500/20 p-2 rounded-lg mr-4">
                              <Globe className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                              <h4 className="font-semibold text-white">Global Disruption Monitoring</h4>
                              <p className="text-sm text-slate-400">Stay ahead of geopolitical, weather, and logistical threats worldwide.</p>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div className="bg-white/5 p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-indigo-400" />
                      How to Use RiskGuard
                  </h3>
                  <ol className="relative border-l border-slate-700 ml-3 space-y-8">
                      <li className="mb-10 ml-6">
                          <span className="absolute flex items-center justify-center w-6 h-6 bg-indigo-600 rounded-full -left-3 ring-8 ring-slate-900">
                              1
                          </span>
                          <h3 className="font-medium leading-tight">Add Your Vendors</h3>
                          <p className="text-sm text-slate-400 mt-1">Navigate to the Vendors tab and manually add your key suppliers. Minimal details required.</p>
                      </li>
                      <li className="mb-10 ml-6">
                          <span className="absolute flex items-center justify-center w-6 h-6 bg-indigo-600 rounded-full -left-3 ring-8 ring-slate-900">
                              2
                          </span>
                          <h3 className="font-medium leading-tight">AI Assessment</h3>
                          <p className="text-sm text-slate-400 mt-1">Our Gemini-powered engine automatically scores financial, cyber, and geopolitical risks.</p>
                      </li>
                      <li className="ml-6">
                          <span className="absolute flex items-center justify-center w-6 h-6 bg-indigo-600 rounded-full -left-3 ring-8 ring-slate-900">
                              3
                          </span>
                          <h3 className="font-medium leading-tight">Act on Intelligence</h3>
                          <p className="text-sm text-slate-400 mt-1">Review the dashboard for critical alerts and visualise dependencies on the Supply Chain Map.</p>
                      </li>
                  </ol>
                  <div className="mt-8 pt-6 border-t border-white/10">
                      <button 
                        onClick={() => setIsAboutModalOpen(false)}
                        className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                      >
                          Get Started <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
