import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import type { Game, GameListResponse, CreateGameRequest, UpdateGameRequest } from '@/lib/api-types';

const AdminGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showImportResult, setShowImportResult] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Form state
  const [formData, setFormData] = useState<CreateGameRequest>({
    gameName: '',
    downloadUrl: '',
    gameType: '',
    extractPassword: '',
    password: '',
    note: '',
    price: 0,
  });

  // Check if user is admin
  useEffect(() => {
    if (!loading && user && !(user as any).is_admin) {
      toast.error('需要管理员权限');
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch games
  const fetchGames = async (page = 1, search = '', gameType = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(gameType && { gameType }),
      });

      const response = await fetch(`${API_BASE_URL}/game/list?${params}`);
      const data: GameListResponse = await response.json();

      if (response.ok) {
        setGames(data.games);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotalGames(data.pagination.total);
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
    fetchGames(currentPage, searchQuery, gameTypeFilter);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGames(1, searchQuery, gameTypeFilter);
  };

  // Handle export
  const handleExportGames = async () => {
    try {
      const token = localStorage.getItem('token');

      toast.info('正在获取游戏数据...');

      // Fetch all games with admin API (returns all games without pagination)
      const response = await fetch(`${API_BASE_URL}/game/list/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data: GameListResponse = await response.json();

      if (!response.ok) {
        throw new Error('获取游戏列表失败');
      }

      if (!data.games || data.games.length === 0) {
        toast.warning('没有游戏数据可以导出');
        return;
      }

      // Convert games data to Excel format
      const exportData = data.games.map((game, index) => ({
        '编号': index + 1,
        '类型': game.game_type || '',
        '游戏名': game.game_name,
        '百度盘': game.download_url || '',
        '提取码': game.password || '',
        '解压码': game.extract_password || '',
        '备注': game.note || '',
        '积分价格': game.price || 0,
        'UUID': game.uuid,
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '游戏列表');

      // Generate file name with current date
      const fileName = `游戏列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;

      // Write file
      XLSX.writeFile(wb, fileName);
      toast.success(`成功导出 ${data.games.length} 个游戏`);
    } catch (error: any) {
      toast.error(error.message || '导出失败');
    }
  };

  // Handle import
  const handleImportGames = async () => {
    if (!importFile) {
      toast.error('请选择要导入的文件');
      return;
    }

    setIsImporting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch(`${API_BASE_URL}/game/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        setShowImportResult(true);
        toast.success(`导入完成！新增: ${data.summary.created}, 更新: ${data.summary.updated}, 失败: ${data.summary.failed}`);
        setIsImportDialogOpen(false);
        setImportFile(null);
        fetchGames(currentPage, searchQuery, gameTypeFilter);
      } else {
        throw new Error(data.error || '导入失败');
      }
    } catch (error: any) {
      toast.error(error.message || '导入失败', {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    } finally {
      setIsImporting(false);
    }
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
        price: formData.price,
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
  const openEditDialog = async (game: Game) => {
    try {
      console.log('Opening edit dialog for game:', game); // 调试日志
      
      // 使用管理员API获取完整的游戏数据
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/game/${game.id}/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const fullGame = data.game;
        
        setEditingGame(fullGame);
        setFormData({
          gameName: fullGame.game_name || '',
          downloadUrl: fullGame.download_url || '',
          gameType: fullGame.game_type || '',
          extractPassword: fullGame.extract_password || '',
          password: fullGame.password || '',
          note: fullGame.note || '',
          price: fullGame.price || 0,
        });
        setIsEditDialogOpen(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取游戏详情失败');
      }
    } catch (error: any) {
      toast.error(error.message || '获取游戏详情失败', {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    }
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
      price: 0,
    });
  };

  if (loading && games.length === 0) {
    return (
      <div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">游戏管理</CardTitle>
              <CardDescription>管理所有游戏资源 (共 {totalGames} 个游戏)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportGames}>
                <Download className="mr-2 h-4 w-4" /> 导出Excel
              </Button>
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> 批量导入
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>批量导入游戏</DialogTitle>
                    <DialogDescription>
                      上传 Excel 文件 (.xlsx 或 .xls) 批量导入游戏数据
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="import-file">选择文件</Label>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-sm text-muted-foreground">
                        文件格式：编号 | 类型 | 游戏名 | 百度盘 | 提取码 | 解压码
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleImportGames} disabled={!importFile || isImporting}>
                      {isImporting ? '导入中...' : '开始导入'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                      <Label htmlFor="price">积分价格 *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        placeholder="例如: 100"
                        required
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
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <form onSubmit={handleSearch} className="mb-6 space-y-4">
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
              <Input
                placeholder="游戏类型 (如: ACT, RPG)"
                className="w-48"
                value={gameTypeFilter}
                onChange={(e) => setGameTypeFilter(e.target.value)}
              />
              <Button type="submit">搜索</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setGameTypeFilter('');
                  fetchGames(1, '', '');
                }}
              >
                重置
              </Button>
            </div>
          </form>

          {/* Games Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>游戏名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>下载链接</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      暂无游戏数据
                    </TableCell>
                  </TableRow>
                ) : (
                  games.map((game) => (
                    <TableRow key={game.uuid}>
                      <TableCell>{game.id}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[100px] truncate" title={game.uuid}>
                        {game.uuid.split('-')[0]}...
                      </TableCell>
                      <TableCell className="font-medium">{game.game_name}</TableCell>
                      <TableCell>{game.game_type || '-'}</TableCell>
                      <TableCell className="font-semibold">{game.price || 0} 积分</TableCell>
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
                onClick={() => fetchGames(currentPage - 1, searchQuery, gameTypeFilter)}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="flex items-center px-4">
                第 {currentPage} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                onClick={() => fetchGames(currentPage + 1, searchQuery, gameTypeFilter)}
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
                <Label htmlFor="edit-price">积分价格 *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-extractPassword">解压密码</Label>
                <Input
                  id="edit-extractPassword"
                  value={formData.extractPassword || ''}
                  onChange={(e) => setFormData({ ...formData, extractPassword: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">游戏密码</Label>
                <Input
                  id="edit-password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-note">备注</Label>
                <Input
                  id="edit-note"
                  value={formData.note || ''}
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

      {/* Import Result Dialog */}
      <Dialog open={showImportResult} onOpenChange={setShowImportResult}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>导入结果</DialogTitle>
            <DialogDescription>
              查看详细的导入统计和记录
            </DialogDescription>
          </DialogHeader>
          {importResult && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">导入摘要</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{importResult.summary.total}</div>
                      <div className="text-sm text-muted-foreground">总计</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{importResult.summary.created}</div>
                      <div className="text-sm text-muted-foreground">新增</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{importResult.summary.updated}</div>
                      <div className="text-sm text-muted-foreground">更新</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{importResult.summary.failed}</div>
                      <div className="text-sm text-muted-foreground">失败</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Updated Records */}
              {importResult.updatedRecords && importResult.updatedRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">更新的游戏 ({importResult.updatedRecords.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>UUID</TableHead>
                            <TableHead>游戏名</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>提取码</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.updatedRecords.slice(0, 50).map((record: any, index: number) => (
                            <TableRow key={record.uuid || index}>
                              <TableCell>{record.id}</TableCell>
                              <TableCell className="font-mono text-xs max-w-[120px] truncate" title={record.uuid}>
                                {record.uuid ? record.uuid.split('-')[0] + '...' : '-'}
                              </TableCell>
                              <TableCell className="font-medium">{record.gameName}</TableCell>
                              <TableCell>{record.gameType || '-'}</TableCell>
                              <TableCell>{record.extractPassword || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {importResult.updatedRecords.length > 50 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          仅显示前 50 条，共 {importResult.updatedRecords.length} 条记录
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Failed Records */}
              {importResult.failedRecords && importResult.failedRecords.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">失败的记录 ({importResult.failedRecords.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>游戏名</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>UUID</TableHead>
                            <TableHead>原因</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.failedRecords.map((record: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{record.gameName}</TableCell>
                              <TableCell>{record.gameType || '-'}</TableCell>
                              <TableCell className="font-mono text-xs">{record.uuid || '-'}</TableCell>
                              <TableCell className="text-red-600 text-sm">{record.reason}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowImportResult(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGamesPage;
