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
  MessageSquare
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
    { icon: MessageSquare, label: 'Feedback', path: '/feedback' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 bg-sidebar transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarCollapsed ? 'md:w-16' : 'w-64'}
        border-r border-sidebar-border
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="bg-eco/10 p-2 rounded-lg">
                <Recycle className="h-6 w-6 text-eco" />
              </div>
              {!sidebarCollapsed && <h1 className="text-xl font-bold text-eco">EcoBin</h1>}
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile close button with arrow */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent"
                title="Close sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {/* Collapse/Expand control inside sidebar list */}
              <li>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`
                    w-full flex items-center gap-3 rounded-lg transition-colors text-sidebar-foreground
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                    ${sidebarCollapsed ? 'justify-center h-10 w-10 mx-auto p-0 bg-sidebar-accent/40' : 'px-3 py-2'}
                  `}
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-6 w-6" />
                  ) : (
                    <ChevronLeft className="h-5 w-5" />
                  )}
                  {!sidebarCollapsed && <span className="font-medium">Collapse</span>}
                </button>
              </li>
              {sidebarItems.map(({ icon: Icon, label, path }) => (
                <li key={path}>
                  <Link
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative group
                      ${sidebarCollapsed ? 'justify-center' : ''}
                      ${isActive(path) 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }
                    `}
                    title={sidebarCollapsed ? label : ''}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="font-medium">{label}</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-sidebar-accent-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {label}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-4 py-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${sidebarCollapsed ? 'h-10 w-10 p-0 mx-auto justify-center' : ''}`}
              onClick={handleLogout}
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3 font-medium">Log out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden"
            title="Open sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-eco text-white">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
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

            <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
              <SheetContent side="right" className="sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Account details</SheetTitle>
                  <SheetDescription>Account details</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-eco text-white">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user?.full_name || '—'}</div>
                      <div className="text-sm text-muted-foreground">{user?.email}</div>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">Active:</span> {user?.is_active ? 'Yes' : 'No'}</div>
                    <div><span className="text-muted-foreground">Joined:</span> {user?.created_at ? new Date(user.created_at).toLocaleString() : '—'}</div>
                  </div>
                  <Button onClick={() => { setProfileOpen(false); navigate('/settings'); }} variant="outline" className="w-full">Manage account</Button>
                  <Button onClick={handleLogout} className="w-full bg-eco hover:bg-eco-dark">Log out</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
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