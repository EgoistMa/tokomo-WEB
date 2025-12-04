import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Lock, Copy, ShoppingCart, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import type { GameWithAccess } from '@/lib/api-types';

const GameDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameWithAccess | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Fetch game details
  const fetchGameDetails = async () => {
    if (!id) {
      toast.error('游戏ID无效');
      navigate('/search');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // 未登录，获取基本信息
        const response = await fetch(`${API_BASE_URL}/game/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setGame({
            ...data.game,
            canViewDownload: false,
            accessReason: 'need_purchase_or_vip',
            isPurchased: false,
          } as GameWithAccess);
        } else {
          throw new Error('获取游戏信息失败');
        }
      } else {
        // 已登录，获取带权限的详细信息
        const response = await fetch(`${API_BASE_URL}/game/${id}/details`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (response.ok) {
          setGame(data.game);
        } else if (response.status === 401) {
          // Token过期
          localStorage.removeItem('token');
          toast.error('登录已过期，请重新登录');
          navigate('/login');
        } else {
          throw new Error(data.error || '获取游戏详情失败');
        }
      }
    } catch (error: any) {
      toast.error(error.message || '获取游戏详情失败');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameDetails();
  }, [id]);

  // Handle purchase
  const handlePurchase = async () => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    if (!game) return;

    setPurchasing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/game/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId: game.id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('购买成功');
        // 刷新游戏详情
        fetchGameDetails();
      } else {
        throw new Error(data.error || '购买失败');
      }
    } catch (error: any) {
      toast.error(error.message || '购买失败');
    } finally {
      setPurchasing(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制到剪贴板`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">游戏不存在</p>
          <Button onClick={() => navigate('/search')} className="mt-4">
            返回搜索
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{game.game_name}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {game.game_type && (
                    <Badge variant="secondary">{game.game_type}</Badge>
                  )}
                  {game.isPurchased && (
                    <Badge className="bg-green-600">
                      <ShoppingCart className="mr-1 h-3 w-3" />
                      已购买
                    </Badge>
                  )}
                  {game.canViewDownload && game.accessReason === 'vip' && !game.isPurchased && (
                    <Badge className="bg-purple-600">
                      <Crown className="mr-1 h-3 w-3" />
                      VIP专享查看
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </div>
            {game.price !== undefined && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">所需积分</p>
                <p className="text-2xl font-bold">{game.price}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game info */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span>游戏ID: </span>
              <span className="font-mono">{game.uuid}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              <span>添加时间: </span>
              <span>{new Date(game.created_at).toLocaleString()}</span>
            </p>
            {game.note && (
              <p className="text-sm text-muted-foreground">
                <span>备注: </span>
                <span>{game.note}</span>
              </p>
            )}
          </div>

          {/* Download info */}
          {game.canViewDownload ? (
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-3">下载信息</h3>
                
                {/* Download URL */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium">下载链接:</p>
                  <div className="flex items-center gap-2">
                    <a 
                      href={game.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex-1 break-all"
                    >
                      {game.download_url}
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(game.download_url, '下载链接')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Password */}
                {game.password && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">提取码:</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded">{game.password}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(game.password!, '提取码')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Extract Password */}
                {game.extract_password && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">解压密码:</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded">{game.extract_password}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(game.extract_password!, '解压密码')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase button for VIP users who haven't purchased */}
              {!game.isPurchased && game.accessReason === 'vip' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                    您正在使用VIP权限查看此游戏。购买后即使VIP过期也可永久访问。
                  </p>
                  <Button 
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full"
                  >
                    {purchasing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    使用 {game.price} 积分购买
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">需要权限才能查看下载信息</h3>
              
              {!user ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    请先登录以购买或使用VIP权限查看
                  </p>
                  <Button onClick={() => navigate('/login')}>
                    立即登录
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    您可以购买此游戏或开通VIP来查看下载信息
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={handlePurchase}
                      disabled={purchasing}
                    >
                      {purchasing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="mr-2 h-4 w-4" />
                      )}
                      使用 {game.price} 积分购买
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/vip')}
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      开通VIP
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Back button */}
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={() => navigate(-1)}>
              返回
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameDetailPage;