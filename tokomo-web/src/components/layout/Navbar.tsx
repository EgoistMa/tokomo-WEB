import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { LogOut, User as UserIcon, Library, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">T</span>
          </div>
          <span className="text-xl font-bold tracking-tight">TOKOMO</span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {!loading && user ? (
            <HoverCard openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto px-4">
                  <span className="font-medium">{user.username}</span>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80" align="end" style={{ backgroundColor: 'white !important', color: 'black !important' }}>
                <div className="flex justify-between space-x-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold" style={{ color: 'black !important' }}>@{user.username}</h4>
                    <p className="text-sm" style={{ color: 'black !important' }}>
                      当前积分: <span className="font-bold text-primary">{user.points || 0}</span>
                    </p>
                    <div className="flex flex-col items-center pt-2 gap-2">
                        <div className="flex items-center gap-2 w-full">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/profile')}>
                                <UserIcon className="mr-2 h-4 w-4" /> 个人中心
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/library')}>
                                <Library className="mr-2 h-4 w-4" /> 游戏库
                            </Button>
                        </div>
                        {(user as any)?.is_admin && (
                          <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/admin')}>
                              <Settings className="mr-2 h-4 w-4" /> 管理后台
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" className="w-full" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> 退出
                        </Button>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <Button onClick={() => navigate('/auth')}>
              登录
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
