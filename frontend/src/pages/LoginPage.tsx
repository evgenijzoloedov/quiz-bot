import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, CardContent } from '../components/ui';
import { Bot, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [telegramId, setTelegramId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!telegramId.trim()) {
      setError('Введите Telegram ID');
      return;
    }

    const id = parseInt(telegramId.trim());
    if (isNaN(id) || id <= 0) {
      setError('Некорректный Telegram ID');
      return;
    }

    setIsLoading(true);

    try {
      await login(id);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Telegram ID не авторизован';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mb-4 shadow-lg shadow-accent-500/30">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#f0f0f5]">Quiz Bot CRM</h1>
            <p className="text-[#606070] mt-1">Панель управления</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Telegram ID"
              type="text"
              placeholder="Введите ваш Telegram ID"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              error={error}
              disabled={isLoading}
              autoFocus
            />

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Войти
            </Button>
          </form>

          {/* Help text */}
          <p className="mt-6 text-center text-sm text-[#606070]">
            Для входа используйте Telegram ID,<br />
            добавленный в список администраторов
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

