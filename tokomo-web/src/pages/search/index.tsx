import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Gift, Loader2, Eye, Copy, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import type { Game } from '@/lib/api-types';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const query = searchParams.get('q') || '';

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState(query);
  const [purchasedGameIds, setPurchasedGameIds] = useState<Set<number>>(new Set());
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameDialog, setShowGameDialog] = useState(false);

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

  // Fetch purchased games to check which ones are already owned
  useEffect(() => {
    if (!user) return;

    const fetchPurchasedGames = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch all purchased games (with a high limit to get all)
        const response = await fetch(`${API_BASE_URL}/game/purchased?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          const purchasedIds = new Set<number>(data.games.map((g: any) => g.id));
          setPurchasedGameIds(purchasedIds);
        }
      } catch (error) {
        console.error('Failed to fetch purchased games:', error);
      }
    };

    fetchPurchasedGames();
  }, [user, API_BASE_URL]);

  // Fetch search results
  useEffect(() => {
    if (!user || !query) return;

    const fetchGames = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          search: query,
          limit: '50',
        });

        const response = await fetch(`${API_BASE_URL}/game/list?${params}`);
        const data = await response.json();

        if (response.ok) {
          setGames(data.games);
          setTotalResults(data.pagination.total);
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

  const handleClaim = async (game: Game) => {
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
        toast.success('领取成功！', {
          description: '已添加到您的游戏库',
        });
        // Add to purchased games list
        setPurchasedGameIds(prev => new Set(prev).add(game.id));
      } else if (response.status === 400 && data.error === 'Game already purchased') {
        toast.warning('您已经领取过这个游戏了');
      } else if (response.status === 404) {
        toast.error('游戏不存在');
      } else {
        throw new Error(data.error || '领取失败');
      }
    } catch (error: any) {
      toast.error(error.message || '领取失败');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleViewGame = (game: Game) => {
    setSelectedGame(game);
    setShowGameDialog(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制到剪贴板`);
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
          <h1 className="text-3xl font-bold tracking-tight">搜索结果</h1>

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
                      <CardDescription className="flex items-center gap-2 mt-2">
                        {game.game_type && (
                          <Badge variant="secondary">{game.game_type}</Badge>
                        )}
                      </CardDescription>
                    </div>
                    {purchasedGameIds.has(game.id) ? (
                      <Button variant="outline" onClick={() => handleViewGame(game)}>
                        <Eye className="mr-2 h-4 w-4" />
                        查看愿望
                      </Button>
                    ) : (
                      <Button onClick={() => handleClaim(game)}>
                        <Gift className="mr-2 h-4 w-4" />
                        领取愿望
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Game Details Dialog */}
      <Dialog open={showGameDialog} onOpenChange={setShowGameDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedGame?.game_name}</DialogTitle>
            <DialogDescription>
              {selectedGame?.game_type && (
                <Badge variant="secondary" className="mt-2">{selectedGame.game_type}</Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedGame && (
            <div className="space-y-4 py-4">
              {/* Download URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">下载链接:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedGame.download_url}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-muted rounded-md"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedGame.download_url, '下载链接')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedGame.download_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Extract Password */}
              {selectedGame.extract_password && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">解压密码:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedGame.extract_password}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-muted rounded-md"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedGame.extract_password!, '解压密码')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Password */}
              {selectedGame.password && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">游戏密码:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedGame.password}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-muted rounded-md"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedGame.password!, '游戏密码')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Note */}
              {selectedGame.note && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">备注:</label>
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    {selectedGame.note}
                  </p>
                </div>
              )}

              {/* Created Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">添加时间:</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedGame.created_at).toLocaleString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => window.open(selectedGame.download_url, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  打开下载链接
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate('/library')}>
                  <Eye className="mr-2 h-4 w-4" />
                  前往游戏库
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchResultsPage;
