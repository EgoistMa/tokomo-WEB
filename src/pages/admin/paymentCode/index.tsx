import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Download, Upload, Loader2, Trash2, Edit, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { RedeemCode } from '@/lib/api-types';

const AdminPaymentCodePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterUsed, setFilterUsed] = useState<string>('all');

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportResultDialog, setShowImportResultDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<RedeemCode | null>(null);

  // Form states
  const [createCode, setCreateCode] = useState('');
  const [createPoints, setCreatePoints] = useState('');
  const [createIsFree, setCreateIsFree] = useState(false);
  const [batchCount, setBatchCount] = useState('');
  const [batchPoints, setBatchPoints] = useState('');
  const [batchPrefix, setBatchPrefix] = useState('');
  const [batchIsFree, setBatchIsFree] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [editIsFree, setEditIsFree] = useState(false);
  const [filterFree, setFilterFree] = useState<string>('all');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Check if user is admin
  useEffect(() => {
    if (!loading && user && !(user as any).is_admin) {
      toast.error('需要管理员权限');
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch codes
  const fetchCodes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (filterUsed !== 'all') {
        params.append('used', filterUsed);
      }

      if (filterFree !== 'all') {
        params.append('isFree', filterFree === 'true' ? '1' : '0');
      }

      const response = await fetch(`${API_BASE_URL}/redeem/codes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setCodes(data.codes);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } else {
        throw new Error('获取兑换码失败');
      }
    } catch (error: any) {
      toast.error(error.message || '获取兑换码失败');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filterUsed, filterFree]);

  useEffect(() => {
    fetchCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterUsed, filterFree]);

  // Create single code
  const handleCreate = async () => {
    if (!createPoints || parseInt(createPoints) <= 0) {
      toast.error('请输入有效的积分数量');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/redeem/codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: createCode.trim() || undefined,
          points: parseInt(createPoints),
          isFree: createIsFree,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('创建成功', {
          description: `兑换码: ${data.code}`,
        });
        setShowCreateDialog(false);
        setCreateCode('');
        setCreatePoints('');
        setCreateIsFree(false);
        fetchCodes();
      } else {
        throw new Error(data.error || '创建失败');
      }
    } catch (error: any) {
      toast.error(error.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Batch create
  const handleBatchCreate = async () => {
    const count = parseInt(batchCount);
    const points = parseInt(batchPoints);

    if (!count || count < 1 || count > 1000) {
      toast.error('数量必须在1-1000之间');
      return;
    }

    if (!points || points <= 0) {
      toast.error('请输入有效的积分数量');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/redeem/codes/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          count,
          points,
          prefix: batchPrefix.trim() || undefined,
          isFree: batchIsFree,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('批量生成成功', {
          description: `成功生成 ${data.created} 个兑换码`,
        });
        setShowBatchDialog(false);
        setBatchCount('');
        setBatchPoints('');
        setBatchPrefix('');
        setBatchIsFree(false);
        fetchCodes();
      } else {
        throw new Error(data.error || '批量生成失败');
      }
    } catch (error: any) {
      toast.error(error.message || '批量生成失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Import codes
  const handleImport = async () => {
    if (!importFile) {
      toast.error('请选择文件');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch(`${API_BASE_URL}/redeem/codes/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        setShowImportDialog(false);
        setShowImportResultDialog(true);
        setImportFile(null);
        fetchCodes();
      } else {
        throw new Error(data.error || '导入失败');
      }
    } catch (error: any) {
      toast.error(error.message || '导入失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Export codes
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (filterUsed !== 'all') {
        params.append('used', filterUsed);
      }

      const response = await fetch(`${API_BASE_URL}/redeem/codes/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `redeem_codes_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('导出成功');
      } else {
        throw new Error('导出失败');
      }
    } catch (error: any) {
      toast.error(error.message || '导出失败');
    }
  };

  // Delete code
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个兑换码吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/redeem/codes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('删除成功');
        fetchCodes();
      } else {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  // Open edit dialog
  const handleOpenEdit = (code: RedeemCode) => {
    setEditingCode(code);
    setEditCode(code.code);
    setEditPoints(code.points.toString());
    setEditIsFree(code.is_free === 1);
    setShowEditDialog(true);
  };

  // Update code
  const handleEdit = async () => {
    if (!editingCode) return;

    if (!editCode.trim()) {
      toast.error('兑换码不能为空');
      return;
    }

    if (!editPoints || parseInt(editPoints) <= 0) {
      toast.error('请输入有效的积分数量');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      // If code changed, we need to delete old and create new
      // If only points changed, we can just update
      const codeChanged = editCode.trim() !== editingCode.code;

      if (codeChanged) {
        // Delete old code
        const deleteResponse = await fetch(`${API_BASE_URL}/redeem/codes/${editingCode.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!deleteResponse.ok) {
          throw new Error('删除旧兑换码失败');
        }

        // Create new code
        const createResponse = await fetch(`${API_BASE_URL}/redeem/codes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: editCode.trim(),
            points: parseInt(editPoints),
            isFree: editIsFree,
          }),
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
          throw new Error(createData.error || '创建新兑换码失败');
        }
      } else {
        // Just update points
        const response = await fetch(`${API_BASE_URL}/redeem/codes/${editingCode.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            points: parseInt(editPoints),
            isFree: editIsFree,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '更新失败');
        }
      }

      toast.success('更新成功');
      setShowEditDialog(false);
      setEditingCode(null);
      setEditCode('');
      setEditPoints('');
      setEditIsFree(false);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">兑换码管理</h1>
            <p className="text-muted-foreground mt-1">
              共 {total} 个兑换码
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              导入
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
            <Button variant="outline" onClick={() => setShowBatchDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              批量生成
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建兑换码
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>状态:</Label>
                <Select value={filterUsed} onValueChange={setFilterUsed}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="0">未使用</SelectItem>
                    <SelectItem value="1">已使用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label>类型:</Label>
                <Select value={filterFree} onValueChange={setFilterFree}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="false">付费码</SelectItem>
                    <SelectItem value="true">免费码</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Codes Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>兑换码</TableHead>
                  <TableHead>积分</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>使用时间</TableHead>
                  <TableHead>使用者ID</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      暂无兑换码
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>{code.id}</TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          {code.code}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{code.points}</TableCell>
                      <TableCell>
                        {code.is_free ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">免费码</Badge>
                        ) : (
                          <Badge variant="default">付费码</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {code.used ? (
                          <Badge variant="secondary">已使用</Badge>
                        ) : (
                          <Badge>未使用</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {code.used_at ? new Date(code.used_at).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>{code.used_by || '-'}</TableCell>
                      <TableCell>{new Date(code.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {code.used === 0 ? (
                            <>
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
                                onClick={() => handleDelete(code.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">已使用</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  第 {page} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建兑换码</DialogTitle>
            <DialogDescription>
              创建单个兑换码，可以自定义码或自动生成
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>兑换码 (可选)</Label>
              <Input
                placeholder="留空自动生成"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>积分 *</Label>
              <Input
                type="number"
                placeholder="100"
                value={createPoints}
                onChange={(e) => setCreatePoints(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-free"
                checked={createIsFree}
                onCheckedChange={(checked) => setCreateIsFree(!!checked)}
              />
              <Label htmlFor="create-free" className="text-sm font-normal">
                免费码 (不计入群组统计)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Create Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量生成兑换码</DialogTitle>
            <DialogDescription>
              批量生成多个兑换码，可以添加前缀
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>数量 (1-1000) *</Label>
              <Input
                type="number"
                placeholder="100"
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>积分 *</Label>
              <Input
                type="number"
                placeholder="50"
                value={batchPoints}
                onChange={(e) => setBatchPoints(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>前缀 (可选)</Label>
              <Input
                placeholder="VIP2025"
                value={batchPrefix}
                onChange={(e) => setBatchPrefix(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="batch-free"
                checked={batchIsFree}
                onCheckedChange={(checked) => setBatchIsFree(!!checked)}
              />
              <Label htmlFor="batch-free" className="text-sm font-normal">
                免费码 (不计入群组统计)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
              取消
            </Button>
            <Button onClick={handleBatchCreate} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              生成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入兑换码</DialogTitle>
            <DialogDescription>
              从 Excel 或 CSV 文件导入兑换码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>文件</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                支持 Excel (.xlsx, .xls) 和 CSV 文件，需要包含"兑换码"和"积分"列
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={submitting || !importFile}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog open={showImportResultDialog} onOpenChange={setShowImportResultDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>导入结果</DialogTitle>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold">{importResult.summary.total}</div>
                    <div className="text-sm text-muted-foreground">总数</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.summary.created}</div>
                    <div className="text-sm text-muted-foreground">成功</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.summary.failed}</div>
                    <div className="text-sm text-muted-foreground">失败</div>
                  </CardContent>
                </Card>
              </div>

              {importResult.failedRecords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">失败记录:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {importResult.failedRecords.map((record: any, index: number) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div>兑换码: {record.code}</div>
                        <div>积分: {record.points}</div>
                        <div className="text-red-600">原因: {record.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowImportResultDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑兑换码</DialogTitle>
            <DialogDescription>
              修改未使用的兑换码信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>兑换码 *</Label>
              <Input
                placeholder="兑换码"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>积分 *</Label>
              <Input
                type="number"
                placeholder="100"
                value={editPoints}
                onChange={(e) => setEditPoints(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-free"
                checked={editIsFree}
                onCheckedChange={(checked) => setEditIsFree(!!checked)}
              />
              <Label htmlFor="edit-free" className="text-sm font-normal">
                免费码 (不计入群组统计)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPaymentCodePage;
