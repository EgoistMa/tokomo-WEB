import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Plus,
  Download,
  Upload,
  Copy,
  Edit,
  Trash2,
  Calendar,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

interface VipCode {
  id: number;
  code: string;
  days: number;
  used: number;
  used_at: string | null;
  used_by: number | null;
  group_id: number | null;
  created_at: string;
}

interface VipCodesResponse {
  codes: VipCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const AdminVipCodePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<VipCode[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterUsed, setFilterUsed] = useState<string>('all');

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createDays, setCreateDays] = useState('30');
  const [createGroupId, setCreateGroupId] = useState('');

  // Batch dialog
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchCount, setBatchCount] = useState('10');
  const [batchDays, setBatchDays] = useState('30');
  const [batchPrefix, setBatchPrefix] = useState('');
  const [batchGroupId, setBatchGroupId] = useState('');
  const [batchCodes, setBatchCodes] = useState<string[]>([]);
  const [showBatchResultDialog, setShowBatchResultDialog] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDays, setEditDays] = useState('');
  const [editUsed, setEditUsed] = useState('0');

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteCode, setDeleteCode] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!user || !(user as any).is_admin)) {
      toast.error('需要管理员权限');
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch VIP codes
  const fetchCodes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (filterUsed !== 'all') {
        params.append('used', filterUsed);
      }

      const response = await fetch(`${API_BASE_URL}/vip/codes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取VIP码列表失败');
      }

      const data: VipCodesResponse = await response.json();
      setCodes(data.codes);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error: any) {
      console.error('Failed to fetch VIP codes:', error);
      toast.error(error.message || '获取VIP码列表失败');
      setCodes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterUsed]);

  // Create single code
  const handleCreate = async () => {
    const days = parseInt(createDays);
    if (isNaN(days) || days <= 0) {
      toast.error('天数必须大于0');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const body: any = { days };
      if (createCode.trim()) body.code = createCode.trim();
      if (createGroupId.trim()) body.groupId = parseInt(createGroupId);

      const response = await fetch(`${API_BASE_URL}/vip/codes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '创建失败');
      }

      const data = await response.json();
      toast.success(`创建成功: ${data.code}`);
      setShowCreateDialog(false);
      setCreateCode('');
      setCreateDays('30');
      setCreateGroupId('');
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || '创建失败');
    }
  };

  // Batch generate
  const handleBatch = async () => {
    const count = parseInt(batchCount);
    const days = parseInt(batchDays);

    if (isNaN(count) || count < 1 || count > 1000) {
      toast.error('数量必须在1-1000之间');
      return;
    }

    if (isNaN(days) || days <= 0) {
      toast.error('天数必须大于0');
      return;
    }

    if (batchPrefix.length > 6) {
      toast.error('前缀最多6个字符');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const body: any = { count, days };
      if (batchPrefix.trim()) body.prefix = batchPrefix.trim();
      if (batchGroupId.trim()) body.groupId = parseInt(batchGroupId);

      const response = await fetch(`${API_BASE_URL}/vip/codes/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '批量生成失败');
      }

      const data = await response.json();
      setBatchCodes(data.codes);
      toast.success(`成功生成 ${data.created} 个VIP码`);
      setShowBatchDialog(false);
      setShowBatchResultDialog(true);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || '批量生成失败');
    }
  };

  // Edit code
  const handleOpenEdit = (code: VipCode) => {
    setEditId(code.id);
    setEditDays(code.days.toString());
    setEditUsed(code.used.toString());
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editId) return;

    try {
      const token = localStorage.getItem('token');
      const body: any = {};

      if (editDays !== '') {
        const days = parseInt(editDays);
        if (isNaN(days) || days <= 0) {
          toast.error('天数必须大于0');
          return;
        }
        body.days = days;
      }

      body.used = parseInt(editUsed);

      const response = await fetch(`${API_BASE_URL}/vip/codes/${editId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新失败');
      }

      toast.success('更新成功');
      setShowEditDialog(false);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    }
  };

  // Delete code
  const handleOpenDelete = (code: VipCode) => {
    setDeleteId(code.id);
    setDeleteCode(code.code);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vip/codes/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      toast.success('删除成功');
      setShowDeleteDialog(false);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterUsed !== 'all') {
        params.append('used', filterUsed);
      }

      const response = await fetch(`${API_BASE_URL}/vip/codes/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vip-codes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('导出成功');
    } catch (error: any) {
      toast.error(error.message || '导出失败');
    }
  };

  // Import from Excel
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vip/codes/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导入失败');
      }

      const data = await response.json();
      toast.success(`导入完成: 成功 ${data.imported} 个，失败 ${data.failed} 个`);
      if (data.errors && data.errors.length > 0) {
        console.error('Import errors:', data.errors);
      }
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || '导入失败');
    }

    // Reset input
    e.target.value = '';
  };

  // Copy batch codes to clipboard
  const copyBatchCodes = () => {
    const text = batchCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  // Export batch codes to Excel
  const exportBatchCodes = () => {
    const ws = XLSX.utils.json_to_sheet(
      batchCodes.map((code) => ({ 'VIP码': code, '天数': batchDays }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VIP码');
    XLSX.writeFile(wb, `batch-vip-codes-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('导出成功');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">VIP码管理</h1>
            <p className="text-muted-foreground mt-1">共 {total} 个VIP码</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              导入
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={() => setShowBatchDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              批量生成
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建VIP码
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>筛选状态</Label>
                <Select value={filterUsed} onValueChange={setFilterUsed}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="0">未使用</SelectItem>
                    <SelectItem value="1">已使用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VIP Codes Table */}
        <Card>
          <CardContent className="pt-6">
            {codes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">暂无VIP码数据</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>VIP码</TableHead>
                      <TableHead>天数</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>使用时间</TableHead>
                      <TableHead>使用者ID</TableHead>
                      <TableHead>群组ID</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>{code.id}</TableCell>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            <span>{code.code}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(code.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {code.days} 天
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.used ? (
                            <Badge variant="secondary">已使用</Badge>
                          ) : (
                            <Badge variant="default">未使用</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.used_at
                            ? new Date(code.used_at).toLocaleString()
                            : '-'}
                        </TableCell>
                        <TableCell>{code.used_by || '-'}</TableCell>
                        <TableCell>
                          {code.group_id ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {code.group_id}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(code.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {code.used === 0 ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEdit(code)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDelete(code)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">已使用</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {page} / {totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建VIP码</DialogTitle>
            <DialogDescription>创建单个VIP码，可自定义或自动生成</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-code">VIP码（留空自动生成）</Label>
              <Input
                id="create-code"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value)}
                placeholder="留空自动生成16位随机码"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-days">天数 *</Label>
              <Input
                id="create-days"
                type="number"
                min="1"
                value={createDays}
                onChange={(e) => setCreateDays(e.target.value)}
                placeholder="VIP天数"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-group">群组ID（可选）</Label>
              <Input
                id="create-group"
                type="number"
                value={createGroupId}
                onChange={(e) => setCreateGroupId(e.target.value)}
                placeholder="关联群组ID"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Generate Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量生成VIP码</DialogTitle>
            <DialogDescription>批量生成多个VIP码</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch-count">生成数量 (1-1000) *</Label>
              <Input
                id="batch-count"
                type="number"
                min="1"
                max="1000"
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
                placeholder="生成数量"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-days">天数 *</Label>
              <Input
                id="batch-days"
                type="number"
                min="1"
                value={batchDays}
                onChange={(e) => setBatchDays(e.target.value)}
                placeholder="VIP天数"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-prefix">前缀（最多6个字符）</Label>
              <Input
                id="batch-prefix"
                maxLength={6}
                value={batchPrefix}
                onChange={(e) => setBatchPrefix(e.target.value)}
                placeholder="VIP码前缀"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-group">群组ID（可选）</Label>
              <Input
                id="batch-group"
                type="number"
                value={batchGroupId}
                onChange={(e) => setBatchGroupId(e.target.value)}
                placeholder="关联群组ID"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
              取消
            </Button>
            <Button onClick={handleBatch}>生成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Result Dialog */}
      <Dialog open={showBatchResultDialog} onOpenChange={setShowBatchResultDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>批量生成结果</DialogTitle>
            <DialogDescription>
              成功生成 {batchCodes.length} 个VIP码
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="max-h-96 overflow-y-auto border rounded p-4">
              <div className="space-y-1 font-mono text-sm">
                {batchCodes.map((code, index) => (
                  <div key={index}>{code}</div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copyBatchCodes} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                复制全部
              </Button>
              <Button variant="outline" onClick={exportBatchCodes} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                导出Excel
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowBatchResultDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑VIP码</DialogTitle>
            <DialogDescription>修改VIP码的天数或状态</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-days">天数</Label>
              <Input
                id="edit-days"
                type="number"
                min="1"
                value={editDays}
                onChange={(e) => setEditDays(e.target.value)}
                placeholder="VIP天数"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-used">状态</Label>
              <Select value={editUsed} onValueChange={setEditUsed}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">未使用</SelectItem>
                  <SelectItem value="1">已使用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除VIP码 "{deleteCode}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminVipCodePage;
