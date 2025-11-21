import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Scan, 
  MapPin, 
  Settings, 
  LogOut, 
  User, 
  Recycle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Crown,
  Gift,
  Mail,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
 


const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Scan, label: 'Scan & Disposal', path: '/disposal' },
    { icon: MapPin, label: 'Bin Locator', path: '/locator' },
    { icon: Crown, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Gift, label: 'Redemption', path: '/redemption' },
    { icon: MessageSquare, label: 'Feedback', path: '/feedback' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const pageMeta = () => {
    const firstName = (user?.full_name || user?.email || 'Eco Warrior').split(' ')[0];
    const map: Record<string, { title: string; subtitle?: string }> = {
      '/dashboard': { title: `Welcome back, ${firstName}!`, subtitle: 'Ready to make a positive impact on the environment today?' },
      '/disposal': { title: 'Scan & Disposal', subtitle: 'Use AI to classify waste and earn points' },
      '/locator': { title: 'Bin Locator', subtitle: 'Find the nearest recycling bins around you' },
      '/leaderboard': { title: 'Leaderboard', subtitle: 'Keep climbing — #1 spot awaits!' },
      '/redemption': { title: 'Redemption', subtitle: 'Convert your points into rewards (coming soon)' },
      '/feedback': { title: 'Feedback', subtitle: 'Help us improve Smart EcoBin' },
      '/settings': { title: 'Settings', subtitle: 'Manage your account and preferences' },
    };
    return map[location.pathname] || { title: 'Smart EcoBin' };
  };

  // Treat backend timestamps without timezone as UTC and format in user's locale
  const parseAsUTC = (s: string) => {
    if (!s) return new Date(NaN);
    const hasTZ = /Z|[+-]\d{2}:?\d{2}$/.test(s);
    return new Date(hasTZ ? s : s.replace(' ', 'T') + 'Z');
  };
  const formatLocalDateTime = (s?: string) => {
    if (!s) return '—';
    const d = parseAsUTC(s);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (fixed) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarCollapsed ? 'md:w-16' : 'md:w-64 w-64'}
        overflow-hidden
        bg-gradient-to-b from-emerald-900 to-emerald-950 text-white
        border-r border-emerald-800/50
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-emerald-800/50">
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="p-2 rounded-lg bg-emerald-700">
                <Recycle className="h-6 w-6 text-white" />
              </div>
              {!sidebarCollapsed && <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-green-400 bg-clip-text text-transparent">EcoBin</h1>}
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} title="Close sidebar" className="text-emerald-100 hover:bg-emerald-800/50">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {/* Collapse/Expand */}
              <li>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`${sidebarCollapsed ? 'justify-center h-10 w-10 mx-auto p-0' : 'px-4 py-3.5'} w-full flex items-center gap-3 rounded-xl transition-all bg-emerald-800/50 hover:bg-emerald-700/50`}
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? <ChevronRight className="h-5 w-5"/> : (<><ChevronLeft className="h-5 w-5"/><span className="text-sm font-medium">Collapse</span></>)}
                </button>
              </li>
              {sidebarItems.map(({ icon: Icon, label, path }) => (
                <li key={path}>
                  <Link
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative group ${sidebarCollapsed ? 'justify-center' : ''} ${isActive(path) ? 'bg-emerald-700 shadow-lg shadow-emerald-900/50' : 'hover:bg-emerald-800/50'}`}
                    title={sidebarCollapsed ? label : ''}
                  >
                    {isActive(path) && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400 rounded-r-full"/>}
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive(path) ? 'text-emerald-300' : 'text-emerald-400'}`}/>
                    {!sidebarCollapsed && <span className={`font-medium ${isActive(path) ? 'text-white' : 'text-emerald-100'}`}>{label}</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-emerald-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                        {label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-emerald-800" />
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-4 py-4 border-t border-emerald-800/50">
            <Button
              variant="ghost"
              className={`w-full justify-start text-red-300 hover:bg-red-900/30 ${sidebarCollapsed ? 'h-10 w-10 p-0 mx-auto justify-center' : ''}`}
              onClick={handleLogout}
              title="Log out"
            >
              <LogOut className="h-5 w-5 text-red-400" />
              {!sidebarCollapsed && <span className="ml-3 font-medium">Log out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content (adds left margin equal to sidebar width on md+) */}
      <div className={`${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} flex-1 flex flex-col transition-all duration-300`}>
        {/* Header (sticky) */}
        <header className="sticky top-0 z-40 h-20 bg-white/90 backdrop-blur border-b border-emerald-200 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden mr-1"
              title="Open sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-emerald-600 text-white font-bold">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" forceMount>
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="leading-tight">
              <div className="text-xl font-bold text-emerald-800">{pageMeta().title}</div>
              {pageMeta().subtitle && <div className="text-sm md:text-base text-emerald-700/80">{pageMeta().subtitle}</div>}
            </div>
          </div>

          <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
            <SheetContent side="right" className="sm:max-w-md p-0 overflow-hidden">
              <button aria-label="Close" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={() => setProfileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
                <h2 className="text-white text-xl font-bold">Account Details</h2>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow">
                    <span className="text-2xl font-bold text-white">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{user?.full_name || '—'}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1 truncate">
                      <Mail className="h-4 w-4" />
                      <span title={user?.email || ''}>{user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-emerald-50 rounded-xl p-4 flex items-center">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Status</p>
                      <p className="text-sm font-semibold text-gray-900">{user?.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 flex items-center">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Joined</p>
                      <p className="text-sm font-semibold text-gray-900">{formatLocalDateTime(user?.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                    variant="outline"
                    className="w-full h-auto py-4 border-2 border-emerald-600 bg-white text-emerald-700 hover:bg-gray-50 hover:text-emerald-800 flex items-center justify-between [&_*]:text-emerald-700 hover:[&_*]:text-emerald-800"
                  >
                    <span className="inline-flex items-center gap-2"><Settings className="h-5 w-5"/> Manage account</span>
                    <ChevronRight className="h-5 w-5"/>
                  </Button>
                  <Button onClick={handleLogout} className="w-full h-auto py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                    <LogOut className="h-5 w-5 mr-2"/> Log out
                  </Button>
                </div>
              </div>
              {/* Stats footer removed as requested */}
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      
    </div>
  );
};

export default AppLayout;