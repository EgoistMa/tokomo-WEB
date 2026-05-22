import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Search, Loader2, UserCheck, UserX, Shield, Copy, Edit, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface User {
  id: number;
  username: string;
  created_at: string;
  is_active: number;
  is_admin: number;
  last_login_at: string | null;
  points: number;
  vip_expire_date: string | null;
}

interface UserDetail extends User {
  security_question: string;
}

interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Detail dialog
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editPoints, setEditPoints] = useState('');
  const [editVipExpire, setEditVipExpire] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  // Reset password dialog
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteUsername, setDeleteUsername] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!user || !(user as any).is_admin)) {
      toast.error('需要管理员权限');
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`${API_BASE_URL}/user/admin/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }

      const data: UserListResponse = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error(error.message || '获取用户列表失败');
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // View user detail
  const handleViewUser = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/admin/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取用户详情失败');
      }

      const data = await response.json();
      setSelectedUser(data.user);
      setShowDetailDialog(true);
    } catch (error: any) {
      toast.error(error.message || '获取用户详情失败');
    }
  };

  // Open edit dialog
  const handleOpenEdit = (user: User) => {
    setEditUserId(user.id);
    setEditPoints(user.points.toString());
    setEditVipExpire(user.vip_expire_date || '');
    setEditIsAdmin(user.is_admin === 1);
    setEditIsActive(user.is_active === 1);
    setShowEditDialog(true);
  };

  // Update user
  const handleUpdate = async () => {
    if (!editUserId) return;

    try {
      const token = localStorage.getItem('token');
      const body: any = {};

      if (editPoints !== '') {
        const points = parseInt(editPoints);
        if (isNaN(points) || points < 0) {
          toast.error('积分必须是非负整数');
          return;
        }
        body.points = points;
      }

      if (editVipExpire !== '') {
        body.vipExpireDate = editVipExpire;
      } else {
        body.vipExpireDate = null;
      }

      body.isAdmin = editIsAdmin;
      body.isActive = editIsActive;

      const response = await fetch(`${API_BASE_URL}/user/admin/${editUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新用户失败');
      }

      toast.success('更新成功');
      setShowEditDialog(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || '更新用户失败');
    }
  };

  // Open reset password dialog
  const handleOpenResetPassword = (user: User) => {
    setResetUserId(user.id);
    setResetUsername(user.username);
    setNewPassword('');
    setShowResetPasswordDialog(true);
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!resetUserId) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error('密码必须至少6个字符');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/admin/${resetUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '重置密码失败');
      }

      toast.success('密码重置成功');
      setShowResetPasswordDialog(false);
    } catch (error: any) {
      toast.error(error.message || '重置密码失败');
    }
  };

  // Open delete dialog
  const handleOpenDelete = (user: User) => {
    setDeleteUserId(user.id);
    setDeleteUsername(user.username);
    setShowDeleteDialog(true);
  };

  // Delete user
  const handleDelete = async () => {
    if (!deleteUserId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/admin/${deleteUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除用户失败');
      }

      toast.success('删除成功');
      setShowDeleteDialog(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || '删除用户失败');
    }
  };

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
            <h1 className="text-3xl font-bold">用户管理</h1>
            <p className="text-muted-foreground mt-1">
              共 {total} 个用户
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户名..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">搜索</Button>
            </form>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="pt-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? '未找到匹配的用户' : '暂无用户数据'}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>用户名</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>VIP到期</TableHead>
                      <TableHead>注册时间</TableHead>
                      <TableHead>最后登录</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          {user.is_admin ? (
                            <Badge variant="default">
                              <Shield className="mr-1 h-3 w-3" />
                              管理员
                            </Badge>
                          ) : (
                            <Badge variant="secondary">用户</Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.points}</TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge variant="default">
                              <UserCheck className="mr-1 h-3 w-3" />
                              正常
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <UserX className="mr-1 h-3 w-3" />
                              停用
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.vip_expire_date
                            ? new Date(user.vip_expire_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleString()
                            : '未登录'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                            >
                              查看
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(user)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenResetPassword(user)}
                            >
                              <KeyRound className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenDelete(user)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>
              查看用户的详细信息
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>用户ID</Label>
                  <div className="flex gap-2">
                    <Input value={selectedUser.id} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedUser.id.toString())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>用户名</Label>
                  <div className="flex gap-2">
                    <Input value={selectedUser.username} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedUser.username)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>账户状态</Label>
                  <div>
                    {selectedUser.is_active ? (
                      <Badge variant="default">
                        <UserCheck className="mr-1 h-3 w-3" />
                        正常
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <UserX className="mr-1 h-3 w-3" />
                        已停用
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>角色</Label>
                  <div>
                    {selectedUser.is_admin ? (
                      <Badge variant="default">
                        <Shield className="mr-1 h-3 w-3" />
                        管理员
                      </Badge>
                    ) : (
                      <Badge variant="secondary">普通用户</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Points & VIP */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>积分</Label>
                  <Input value={selectedUser.points} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>VIP到期时间</Label>
                  <Input
                    value={
                      selectedUser.vip_expire_date
                        ? new Date(selectedUser.vip_expire_date).toLocaleString()
                        : '非VIP用户'
                    }
                    readOnly
                  />
                </div>
              </div>

              {/* Security Question */}
              <div className="space-y-2">
                <Label>安全问题</Label>
                <Input value={selectedUser.security_question} readOnly />
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>注册时间</Label>
                  <Input
                    value={new Date(selectedUser.created_at).toLocaleString()}
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label>最后登录</Label>
                  <Input
                    value={
                      selectedUser.last_login_at
                        ? new Date(selectedUser.last_login_at).toLocaleString()
                        : '从未登录'
                    }
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              更新用户的积分、VIP状态、权限和账号状态
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-points">积分</Label>
              <Input
                id="edit-points"
                type="number"
                min="0"
                value={editPoints}
                onChange={(e) => setEditPoints(e.target.value)}
                placeholder="用户积分"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vip">VIP到期日期</Label>
              <Input
                id="edit-vip"
                type="date"
                value={editVipExpire}
                onChange={(e) => setEditVipExpire(e.target.value)}
                placeholder="留空表示非VIP"
              />
              <p className="text-xs text-muted-foreground">留空表示非VIP用户</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is-admin"
                checked={editIsAdmin}
                onCheckedChange={(checked) => setEditIsAdmin(checked as boolean)}
              />
              <Label htmlFor="edit-is-admin" className="cursor-pointer">
                管理员权限
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is-active"
                checked={editIsActive}
                onCheckedChange={(checked) => setEditIsActive(checked as boolean)}
              />
              <Label htmlFor="edit-is-active" className="cursor-pointer">
                账号启用
              </Label>
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

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为用户 "{resetUsername}" 设置新密码
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少6个字符"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              取消
            </Button>
            <Button onClick={handleResetPassword}>重置密码</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户 "{deleteUsername}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminUsersPage;
