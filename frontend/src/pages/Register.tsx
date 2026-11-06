import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { GradientMesh } from '@/components/ui/login-page-utils/gradient-mesh';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/login-page-utils/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { validateForm } from '../lib/formValidation';
import { useTheme } from '../context/ThemeContext';
import { FinoraMark } from '../components/FinoraMark';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!validateForm(e, setError)) return;
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { email, password });
      localStorage.setItem('finora_user', JSON.stringify(response.data.user));
      setTheme(false);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não foi possível criar sua conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background text-foreground animate-fadeIn">
      <div className="flex flex-col justify-between p-6 md:p-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center text-[#ff682c]">
              <FinoraMark className="w-8 h-8" />
            </div>
            <div>
              <span className="font-polysans text-2xl font-semibold tracking-tight">
                Finora<span className="text-[#ff682c]">.</span>
              </span>
              <span className="block text-[10px] font-inter uppercase tracking-widest text-muted-foreground">Finanças pessoais</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 w-full items-center justify-center max-w-md mx-auto py-12">
          <div className="w-full">
            {error && (
              <div className="mb-6 p-4 rounded-xl shadow-sm flex items-center gap-3 text-sm font-inter bg-destructive/10 border border-destructive/30 text-destructive" role="alert">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form noValidate onSubmit={handleRegister} className="flex flex-col gap-6">
              <FieldGroup>
                <div className="flex flex-col items-center gap-1.5 text-center mb-2">
                  <h1 className="text-3xl font-bold font-polysans tracking-tight">Crie sua conta</h1>
                  <p className="text-muted-foreground text-sm font-inter">
                    Cadastre seu e-mail e uma senha para começar. Você entra na hora.
                  </p>
                </div>

                <Field>
                  <FieldLabel htmlFor="register-email">E-mail</FieldLabel>
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="register-password">Senha</FieldLabel>
                  <Input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                  <FieldDescription>Use pelo menos 8 caracteres.</FieldDescription>
                </Field>

                <Field>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Criando conta...' : 'Criar conta e entrar'}
                  </Button>
                </Field>

                <Field>
                  <FieldDescription className="text-center mt-4">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="underline underline-offset-4 text-foreground font-medium hover:text-[#ff682c]">
                      Faça login
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </div>
        </div>

      </div>

      <div className="bg-muted relative hidden lg:block overflow-hidden">
        <GradientMesh
          colors={['#ff682c', '#00aaff', '#1a1a1a']}
          distortion={8}
          swirl={0.2}
          speed={1}
          rotation={90}
          waveAmp={0.2}
          waveFreq={20}
          waveSpeed={0.2}
          grain={0.06}
        />
        <div className="absolute inset-0 flex items-center justify-center p-12 bg-black/20 backdrop-blur-[2px]">
          <div className="max-w-lg text-white space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-polysans bg-white/20 backdrop-blur-md">
              Finanças pessoais
            </span>
            <h2 className="text-4xl font-normal font-polysans tracking-tight">
              Suas finanças, organizadas em um só lugar.
            </h2>
            <p className="text-white/80 font-inter text-sm leading-relaxed">
              Comece com uma conta simples. Registre receitas, despesas, limites e metas, e encontre tudo salvo no próximo acesso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
