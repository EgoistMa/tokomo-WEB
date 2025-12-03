import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Loader2, Users, Copy, Edit, Trash2, Eye, BarChart, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { Group, GroupDetail, GroupStatistics } from '@/lib/api-types';

const AdminGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  // Data states
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStatistics | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [createName, setCreateName] = useState('');
  const [createInviteCode, setCreateInviteCode] = useState('');
  const [createRewardPoints, setCreateRewardPoints] = useState('');
  const [createNote, setCreateNote] = useState('');

  const [editName, setEditName] = useState('');
  const [editInviteCode, setEditInviteCode] = useState('');
  const [editRewardPoints, setEditRewardPoints] = useState('');
  const [editNote, setEditNote] = useState('');

  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!user || !(user as any).is_admin)) {
      toast.error('需要管理员权限');
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch groups
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`${API_BASE_URL}/group/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setGroups(data.groups);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } else {
        throw new Error('获取群组列表失败');
      }
    } catch (error: any) {
      toast.error(error.message || '获取群组列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Create group
  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error('请输入群组名称');
      return;
    }

    const points = parseInt(createRewardPoints);
    if (isNaN(points) || points < 0) {
      toast.error('奖励积分必须大于等于0');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/group/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createName.trim(),
          inviteCode: createInviteCode.trim() || undefined,
          rewardPoints: points,
          note: createNote.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('创建成功', {
          description: `邀请码: ${data.inviteCode}`,
        });
        setShowCreateDialog(false);
        setCreateName('');
        setCreateInviteCode('');
        setCreateRewardPoints('');
        setCreateNote('');
        fetchGroups();
      } else {
        throw new Error(data.error || '创建失败');
      }
    } catch (error: any) {
      toast.error(error.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const handleOpenEdit = (group: Group) => {
    setSelectedGroup(group);
    setEditName(group.name);
    setEditInviteCode(group.invite_code);
    setEditRewardPoints(group.reward_points.toString());
    setEditNote(group.note || '');
    setShowEditDialog(true);
  };

  // Update group
  const handleEdit = async () => {
    if (!selectedGroup) return;

    const points = parseInt(editRewardPoints);
    if (isNaN(points) || points < 0) {
      toast.error('奖励积分必须大于等于0');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/group/${selectedGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          inviteCode: editInviteCode.trim() || undefined,
          rewardPoints: points,
          note: editNote.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success('更新成功');
        setShowEditDialog(false);
        setSelectedGroup(null);
        fetchGroups();
      } else {
        const data = await response.json();
        throw new Error(data.error || '更新失败');
      }
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete group
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个群组吗？这将同时删除所有成员关系。')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/group/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('删除成功');
        fetchGroups();
      } else {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  // View group details
  const handleViewDetail = async (group: Group) => {
    setSelectedGroup(group);
    setShowDetailDialog(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/group/${group.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setGroupDetail(data.group);
      }
    } catch (error) {
      console.error('Failed to fetch group detail:', error);
    }
  };

  // View statistics
  const handleViewStats = async (group: Group) => {
    setSelectedGroup(group);
    setShowStatsDialog(true);
    setStatsStartDate('');
    setStatsEndDate('');

    await fetchGroupStats(group.id);
  };

  const fetchGroupStats = async (groupId: number, startDate?: string, endDate?: string) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${API_BASE_URL}/group/${groupId}/statistics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setGroupStats(data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch group statistics:', error);
    }
  };

  const handleFilterStats = () => {
    if (selectedGroup) {
      fetchGroupStats(selectedGroup.id, statsStartDate, statsEndDate);
    }
  };

  // Add member
  const handleOpenAddMember = (group: Group) => {
    setSelectedGroup(group);
    setAddMemberUserId('');
    setShowAddMemberDialog(true);
  };

  const handleAddMember = async () => {
    if (!selectedGroup) return;

    const userId = parseInt(addMemberUserId);
    if (isNaN(userId)) {
      toast.error('请输入有效的用户ID');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/group/${selectedGroup.id}/members/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success('添加成功');
        setShowAddMemberDialog(false);
        setAddMemberUserId('');
        fetchGroups();
      } else {
        const data = await response.json();
        throw new Error(data.error || '添加失败');
      }
    } catch (error: any) {
      toast.error(error.message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (groupId: number, userId: number) => {
    if (!confirm('确定要移除该用户吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/group/${groupId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('移除成功');
        if (groupDetail) {
          const updatedDetail = {
            ...groupDetail,
            members: groupDetail.members.filter(m => m.user_id !== userId),
            member_count: (groupDetail.member_count || 0) - 1,
          };
          setGroupDetail(updatedDetail);
        }
        fetchGroups();
      } else {
        const data = await response.json();
        throw new Error(data.error || '移除失败');
      }
    } catch (error: any) {
      toast.error(error.message || '移除失败');
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
            <h1 className="text-3xl font-bold">群组管理</h1>
            <p className="text-muted-foreground mt-1">
              共 {total} 个群组
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建群组
          </Button>
        </div>

        {/* Groups Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>群组名称</TableHead>
                  <TableHead>邀请码</TableHead>
                  <TableHead>奖励积分</TableHead>
                  <TableHead>成员数</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      暂无群组
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.id}</TableCell>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          {group.invite_code}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(group.invite_code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{group.reward_points}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Users className="mr-1 h-3 w-3" />
                          {group.member_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(group.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(group)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewStats(group)}
                          >
                            <BarChart className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(group)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAddMember(group)}
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(group.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
            <DialogTitle>创建群组</DialogTitle>
            <DialogDescription>
              创建新群组，可自定义邀请码或自动生成
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>群组名称 *</Label>
              <Input
                placeholder="VIP用户群"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>邀请码 (可选)</Label>
              <Input
                placeholder="留空自动生成"
                value={createInviteCode}
                onChange={(e) => setCreateInviteCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>奖励积分 *</Label>
              <Input
                type="number"
                placeholder="500"
                value={createRewardPoints}
                onChange={(e) => setCreateRewardPoints(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>备注 (可选)</Label>
              <Input
                placeholder="群组说明"
                value={createNote}
                onChange={(e) => setCreateNote(e.target.value)}
              />
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑群组</DialogTitle>
            <DialogDescription>
              修改群组信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>群组名称</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>邀请码</Label>
              <Input
                value={editInviteCode}
                onChange={(e) => setEditInviteCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>奖励积分</Label>
              <Input
                type="number"
                value={editRewardPoints}
                onChange={(e) => setEditRewardPoints(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              群组详情和成员列表
            </DialogDescription>
          </DialogHeader>
          {groupDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>邀请码</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={groupDetail.invite_code} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(groupDetail.invite_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>奖励积分</Label>
                  <Input value={groupDetail.reward_points} readOnly className="mt-1" />
                </div>
              </div>
              {groupDetail.note && (
                <div>
                  <Label>备注</Label>
                  <p className="text-sm text-muted-foreground mt-1">{groupDetail.note}</p>
                </div>
              )}
              <div>
                <Label>成员列表 ({groupDetail.members?.length || 0})</Label>
                <div className="mt-2 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用户ID</TableHead>
                        <TableHead>用户名</TableHead>
                        <TableHead>加入时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupDetail.members?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                            暂无成员
                          </TableCell>
                        </TableRow>
                      ) : (
                        groupDetail.members?.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>{member.user_id}</TableCell>
                            <TableCell>{member.username}</TableCell>
                            <TableCell>{new Date(member.joined_at).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveMember(groupDetail.id, member.user_id)}
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>群组统计</DialogTitle>
            <DialogDescription>
              {selectedGroup?.name} - 兑换码使用统计
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Date filters */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={statsStartDate}
                  onChange={(e) => setStatsStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={statsEndDate}
                  onChange={(e) => setStatsEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleFilterStats}>筛选</Button>
              </div>
            </div>

            {/* Statistics summary */}
            {groupStats && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">已使用兑换码</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{groupStats.total_codes_used}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">总奖励积分</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{groupStats.total_points_rewarded}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Codes table */}
                <div>
                  <Label>兑换码使用记录</Label>
                  <div className="mt-2 border rounded-md max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>兑换码</TableHead>
                          <TableHead>积分</TableHead>
                          <TableHead>使用时间</TableHead>
                          <TableHead>用户ID</TableHead>
                          <TableHead>用户名</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupStats.codes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                              暂无记录
                            </TableCell>
                          </TableRow>
                        ) : (
                          groupStats.codes.map((code) => (
                            <TableRow key={code.id}>
                              <TableCell className="font-mono">{code.code}</TableCell>
                              <TableCell>{code.points}</TableCell>
                              <TableCell>{new Date(code.used_at).toLocaleString()}</TableCell>
                              <TableCell>{code.user_id}</TableCell>
                              <TableCell>{code.username}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowStatsDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加成员</DialogTitle>
            <DialogDescription>
              手动添加用户到群组 (不发放奖励积分)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>用户ID *</Label>
              <Input
                type="number"
                placeholder="输入用户ID"
                value={addMemberUserId}
                onChange={(e) => setAddMemberUserId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddMember} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminGroupsPage;
