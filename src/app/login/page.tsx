'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Scale, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('E-mail ou senha inválidos. Tente novamente.');
      setLoading(false);
    } else {
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-neutral-900/80 border border-amber-500/20 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        
        {/* LOGO & CABEÇALHO */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Scale className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-neutral-100 uppercase font-serif">
            Gestão Trabalhista
          </h1>
          <p className="text-xs text-neutral-400">
            Acesse o painel de controle e acompanhamento processual.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advogado@escritorio.com"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-600/20 uppercase tracking-wider"
          >
            {loading ? 'Acessando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p className="text-center text-[10px] text-neutral-600">
          © {new Date().getFullYear()} Gestão de Processos Trabalhistas. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}