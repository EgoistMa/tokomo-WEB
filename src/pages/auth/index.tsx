import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LoginResponse, RegisterResponse } from '@/lib/api-types';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth';

type AuthMode = 'login' | 'register' | 'reset';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: input username, 1: input answer & new password
  const [fetchedQuestion, setFetchedQuestion] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [inviteCode, setInviteCode] = useState('');

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any).error || 'Login failed');
      }

      const { token } = data as LoginResponse;
      login(token);
      navigate('/');
    } catch (error: any) {
      const message = error.message || "登录失败";
      toast.error(message, {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, securityQuestion, securityAnswer, inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any).error || 'Register failed');
      }

      const { token } = data as RegisterResponse;
      login(token);
      navigate('/');
    } catch (error: any) {
      const message = error.message || "注册失败";
      toast.error(message, {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSecurityQuestion = async () => {
    if (!username) {
        toast.error("请输入用户名", {
          style: {
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
          },
          duration: 4000,
        });
        return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/securityQuestion?username=${username}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any).error || 'Failed to get security question');
      }

      setFetchedQuestion((data as any).question);
      setResetStep(1);
    } catch (error: any) {
      const message = error.message || "获取安全问题失败";
      toast.error(message, {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/resetPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, securityAnswer, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any).error || 'Reset password failed');
      }

      toast.success("密码重置成功，请登录");
      setAuthMode('login');
      setResetStep(0);
      setPassword('');
      setNewPassword('');
    } catch (error: any) {
      const message = error.message || "重置密码失败";
      toast.error(message, {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
        handleLogin();
    } else if (authMode === 'register') {
        handleRegister();
    } else if (authMode === 'reset') {
        if (resetStep === 0) {
            handleGetSecurityQuestion();
        } else {
            handleResetPassword();
        }
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setResetStep(0);
    setFetchedQuestion('');
    // Clear sensitive fields?
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 dark:bg-zinc-900/50">
      <Card className="w-full max-w-md shadow-lg animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {authMode === 'login' && '登录'}
              {authMode === 'register' && '创建账户'}
              {authMode === 'reset' && '重置密码'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              返回主页
            </Button>
          </div>
          <CardDescription>
            {authMode === 'login' && '输入您的凭据以访问您的账户'}
            {authMode === 'register' && '填写信息开始使用'}
            {authMode === 'reset' && (resetStep === 0 ? '请输入用户名以获取安全问题' : '回答安全问题以重置密码')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username Field - Common to all modes */}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading || (authMode === 'reset' && resetStep === 1)} 
              />
            </div>

            {/* Login Mode Fields */}
            {authMode === 'login' && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">密码</Label>
                        <button
                            type="button"
                            onClick={() => switchMode('reset')}
                            className="text-xs text-primary underline-offset-4 hover:underline"
                        >
                            忘记密码?
                        </button>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
            )}

            {/* Register Mode Fields */}
            {authMode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security-question">安全问题</Label>
                  <Input
                    id="security-question"
                    placeholder="请输入您的安全问题"
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security-answer">安全问题答案</Label>
                  <Input
                    id="security-answer"
                    placeholder="您的答案"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-code">邀请码 <span className="text-muted-foreground font-normal">(可选)</span></Label>
                  <Input
                    id="invite-code"
                    placeholder="请输入邀请码"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {/* Reset Password Mode Fields */}
            {authMode === 'reset' && resetStep === 1 && (
                <>
                    <div className="space-y-2">
                        <Label>安全问题</Label>
                        <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                            {fetchedQuestion}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reset-answer">安全问题答案</Label>
                        <Input
                            id="reset-answer"
                            placeholder="您的答案"
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">新密码</Label>
                        <Input
                            id="new-password"
                            type="password"
                            placeholder="请输入新密码"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {authMode === 'login' && '登录'}
              {authMode === 'register' && '注册'}
              {authMode === 'reset' && (resetStep === 0 ? '下一步' : '重置密码')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
            {authMode === 'reset' ? (
                 <button
                 onClick={() => switchMode('login')}
                 className="flex items-center justify-center gap-1 hover:text-primary transition-colors disabled:opacity-50"
                 disabled={isLoading}
             >
                 <ArrowLeft className="h-4 w-4" /> 返回登录
             </button>
            ) : (
                <div className="flex gap-1 justify-center">
                    {authMode === 'login' ? "没有账户?" : "已有账户?"}
                    <button
                        onClick={() => switchMode(authMode === 'login' ? 'register' : 'login')}
                        className="underline underline-offset-4 hover:text-primary transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {authMode === 'login' ? '注册' : '登录'}
                    </button>
                </div>
            )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
