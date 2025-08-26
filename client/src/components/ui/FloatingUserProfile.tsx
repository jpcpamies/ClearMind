import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { 
  User, 
  Settings, 
  Moon, 
  Sun, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';

export default function FloatingUserProfile() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Add theme switching logic here if needed
  };

  return (
    <div className="fixed top-4 right-4 z-[1000]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="frosted-glass-bg rounded-lg p-2 h-auto hover:bg-white/30 transition-all"
            data-testid="floating-user-profile"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-white/50">
                  <AvatarImage 
                    src={user.profileImageUrl} 
                    alt={user.displayName} 
                  />
                  <AvatarFallback className="bg-purple-600 text-white text-sm font-medium">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              {/* Username - hidden on mobile */}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                  {user.displayName}
                </p>
                <p className="text-xs text-white/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                  @{user.username}
                </p>
              </div>
              
              <ChevronDown className="h-4 w-4 text-white/80 hidden sm:block" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          align="end" 
          className="w-64 mt-2 bg-white border border-gray-200 shadow-lg"
          sideOffset={8}
        >
          {/* User info section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={user.profileImageUrl} 
                  alt={user.displayName} 
                />
                <AvatarFallback className="bg-purple-600 text-white font-medium">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <DropdownMenuItem className="px-4 py-2 cursor-pointer">
            <User className="h-4 w-4 mr-3" />
            Profile Settings
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={toggleTheme}
            className="px-4 py-2 cursor-pointer"
          >
            {isDark ? (
              <Sun className="h-4 w-4 mr-3" />
            ) : (
              <Moon className="h-4 w-4 mr-3" />
            )}
            Switch Theme
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={handleLogout}
            className="px-4 py-2 cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}