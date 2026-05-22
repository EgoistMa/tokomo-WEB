import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Eye, Crown, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import type { GameWithAccess, GameListWithAccessResponse } from '@/lib/api-types';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const query = searchParams.get('q') || '';

  const [games, setGames] = useState<GameWithAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState(query);
  const [userStatus, setUserStatus] = useState<{ isVip: boolean; vipExpireDate: string | null } | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Check login status
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('请先登录后再搜索游戏');
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Update searchQuery when URL query changes
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);


  // Fetch search results
  useEffect(() => {
    if (!user || !query) return;

    const fetchGames = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          search: query,
          limit: '50',
        });

        const response = await fetch(`${API_BASE_URL}/game/list-with-access?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data: GameListWithAccessResponse = await response.json();

        if (response.ok) {
          setGames(data.games);
          setTotalResults(data.pagination.total);
          setUserStatus(data.userStatus);
        } else {
          throw new Error('搜索失败');
        }
      } catch (error: any) {
        toast.error(error.message || '搜索失败');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [query, user, API_BASE_URL]);

  const handlePurchase = async (game: GameWithAccess) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        navigate('/auth');
        return;
      }

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
        toast.success('购买成功！', {
          description: `消耗 ${game.price} 积分`,
        });
        // 重新获取游戏列表以更新状态
        const newQuery = searchParams.get('q') || '';
        if (newQuery) {
          // 触发重新搜索
          setSearchQuery(newQuery + ' ');
          setTimeout(() => setSearchQuery(newQuery), 100);
        }
      } else if (response.status === 400 && data.error === 'Game already purchased') {
        toast.warning('您已经购买过这个游戏了');
      } else if (response.status === 404) {
        toast.error('游戏不存在');
      } else {
        throw new Error(data.error || '购买失败');
      }
    } catch (error: any) {
      toast.error(error.message || '购买失败');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleViewGame = (game: GameWithAccess) => {
    navigate(`/game/${game.id}`);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">搜索结果</h1>
            {userStatus?.isVip && (
              <Badge className="bg-purple-600 text-white">
                <Crown className="mr-1 h-3 w-3" />
                VIP会员
                {userStatus.vipExpireDate && (
                  <span className="ml-1">
                    (至{new Date(userStatus.vipExpireDate).toLocaleDateString()})
                  </span>
                )}
              </Badge>
            )}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="输入关键词搜索..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">许愿</Button>
          </form>

          <p className="text-muted-foreground">
            关键词: <span className="font-medium text-foreground">"{query}"</span>
            {!loading && <span className="ml-2">({totalResults} 个结果)</span>}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* No Results */}
        {!loading && games.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">未找到相关游戏</p>
              <p className="text-sm text-muted-foreground mt-2">
                尝试使用其他关键词搜索
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {!loading && games.length > 0 && (
          <div className="grid gap-4">
            {games.map((game) => (
              <Card key={game.uuid} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{game.game_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2 flex-wrap">
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
                        {game.price !== undefined && (
                          <Badge variant="outline">
                            {game.price} 积分
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {game.canViewDownload ? (
                        <Button variant="outline" onClick={() => handleViewGame(game)}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => handleViewGame(game)}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </Button>
                      )}
                      {!game.isPurchased && game.price !== undefined && (
                        <Button onClick={() => handlePurchase(game)}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {game.price} 积分购买
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default SearchResultsPage;
