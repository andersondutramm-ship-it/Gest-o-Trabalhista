'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checarSessao() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUsuarioEmail(session.user?.email || 'Usuário');
        setLoading(false);
      }
    }
    checarSessao();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Topbar / Cabeçalho */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel Principal</h1>
            <p className="text-xs text-slate-500 mt-1">
              Bem-vindo, <span className="font-semibold text-slate-700">{usuarioEmail}</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium rounded-lg border border-rose-200 transition-colors"
          >
            Sair da conta
          </button>
        </div>

        {/* Grid de Cards de Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Processos */}
          <Link 
            href="/processos" 
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all block"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                ⚖️
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                Acessar →
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
              Processos
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gerencie ações judiciais, partes e andamentos dos processos cadastrados.
            </p>
          </Link>

          {/* Card 2: Prazos e Tarefas */}
          <Link 
            href="/prazos" 
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all block"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                📅
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                Acessar →
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
              Prazos
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Controle de prazos processuais, audiências e compromissos importantes.
            </p>
          </Link>

          {/* Card 3: Usuários / Configurações */}
          <Link 
            href="/admin/usuarios" 
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all block"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                👥
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                Acessar →
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              Usuários
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Administre acessos, permissões e membros da sua equipe ou escritório.
            </p>
          </Link>

        </div>

      </div>
    </div>
  );
}