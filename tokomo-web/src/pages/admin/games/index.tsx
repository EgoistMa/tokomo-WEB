import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { Game, GameListResponse, CreateGameRequest, UpdateGameRequest } from '@/lib/api-types';

const AdminGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Form state
  const [formData, setFormData] = useState<CreateGameRequest>({
    gameName: '',
    downloadUrl: '',
    gameType: '',
    extractPassword: '',
    password: '',
    note: '',
  });

  // Check if user is admin
  useEffect(() => {
    if (!loading && user && !(user as any).is_admin) {
      toast.error('需要管理员权限');
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch games
  const fetchGames = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      });

      const response = await fetch(`${API_BASE_URL}/game/list?${params}`);
      const data: GameListResponse = await response.json();

      if (response.ok) {
        setGames(data.games);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error('获取游戏列表失败');
      }
    } catch (error: any) {
      toast.error(error.message || '获取游戏列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames(currentPage, searchQuery);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGames(1, searchQuery);
  };

  // Create game
  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/game/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('游戏创建成功');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchGames(currentPage, searchQuery);
      } else {
        throw new Error(data.error || '创建游戏失败');
      }
    } catch (error: any) {
      toast.error(error.message || '创建游戏失败', {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    }
  };

  // Update game
  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    try {
      const token = localStorage.getItem('token');
      const updateData: UpdateGameRequest = {
        gameName: formData.gameName,
        downloadUrl: formData.downloadUrl,
        gameType: formData.gameType,
        extractPassword: formData.extractPassword,
        password: formData.password,
        note: formData.note,
      };

      const response = await fetch(`${API_BASE_URL}/game/${editingGame.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('游戏更新成功');
        setIsEditDialogOpen(false);
        setEditingGame(null);
        resetForm();
        fetchGames(currentPage, searchQuery);
      } else {
        throw new Error(data.error || '更新游戏失败');
      }
    } catch (error: any) {
      toast.error(error.message || '更新游戏失败', {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    }
  };

  // Delete game
  const handleDeleteGame = async (gameId: number) => {
    if (!confirm('确定要删除这个游戏吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/game/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('游戏删除成功');
        fetchGames(currentPage, searchQuery);
      } else {
        throw new Error(data.error || '删除游戏失败');
      }
    } catch (error: any) {
      toast.error(error.message || '删除游戏失败', {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (game: Game) => {
    setEditingGame(game);
    setFormData({
      gameName: game.game_name,
      downloadUrl: game.download_url,
      gameType: game.game_type || '',
      extractPassword: game.extract_password || '',
      password: game.password || '',
      note: game.note || '',
    });
    setIsEditDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      gameName: '',
      downloadUrl: '',
      gameType: '',
      extractPassword: '',
      password: '',
      note: '',
    });
  };

  if (loading && games.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">游戏管理</CardTitle>
              <CardDescription>管理所有游戏资源</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" /> 添加游戏
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleCreateGame}>
                  <DialogHeader>
                    <DialogTitle>添加新游戏</DialogTitle>
                    <DialogDescription>填写游戏信息</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="gameName">游戏名称 *</Label>
                      <Input
                        id="gameName"
                        value={formData.gameName}
                        onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="downloadUrl">下载链接 *</Label>
                      <Input
                        id="downloadUrl"
                        type="url"
                        value={formData.downloadUrl}
                        onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gameType">游戏类型</Label>
                      <Input
                        id="gameType"
                        value={formData.gameType}
                        onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}
                        placeholder="例如: 动作冒险"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="extractPassword">解压密码</Label>
                      <Input
                        id="extractPassword"
                        value={formData.extractPassword}
                        onChange={(e) => setFormData({ ...formData, extractPassword: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">游戏密码</Label>
                      <Input
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="note">备注</Label>
                      <Input
                        id="note"
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        placeholder="游戏描述或说明"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">创建</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索游戏名称..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">搜索</Button>
            </div>
          </form>

          {/* Games Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>游戏名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>下载链接</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      暂无游戏数据
                    </TableCell>
                  </TableRow>
                ) : (
                  games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>{game.id}</TableCell>
                      <TableCell className="font-medium">{game.game_name}</TableCell>
                      <TableCell>{game.game_type || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <a
                          href={game.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {game.download_url}
                        </a>
                      </TableCell>
                      <TableCell>{new Date(game.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(game)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteGame(game.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => fetchGames(currentPage - 1, searchQuery)}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="flex items-center px-4">
                第 {currentPage} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                onClick={() => fetchGames(currentPage + 1, searchQuery)}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdateGame}>
            <DialogHeader>
              <DialogTitle>编辑游戏</DialogTitle>
              <DialogDescription>修改游戏信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-gameName">游戏名称 *</Label>
                <Input
                  id="edit-gameName"
                  value={formData.gameName}
                  onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-downloadUrl">下载链接 *</Label>
                <Input
                  id="edit-downloadUrl"
                  type="url"
                  value={formData.downloadUrl}
                  onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-gameType">游戏类型</Label>
                <Input
                  id="edit-gameType"
                  value={formData.gameType}
                  onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-extractPassword">解压密码</Label>
                <Input
                  id="edit-extractPassword"
                  value={formData.extractPassword}
                  onChange={(e) => setFormData({ ...formData, extractPassword: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">游戏密码</Label>
                <Input
                  id="edit-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-note">备注</Label>
                <Input
                  id="edit-note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">更新</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGamesPage;
