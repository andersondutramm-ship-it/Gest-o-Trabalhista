'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Usuario {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    verificarAcessoEBuscarUsuarios();
  }, []);

  async function verificarAcessoEBuscarUsuarios() {
    setLoading(true);

    // VERIFICAÇÃO DE LOGIN COMENTADA TEMPORARIAMENTE PARA TESTES
    /*
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    */

    await carregarUsuarios();
    setLoading(false);
  }

  async function carregarUsuarios() {
    // Tenta buscar perfis da tabela de usuários se configurada
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.warn('Nota: Se a tabela "profiles" não existir no Supabase, crie-a no seu painel.', error.message);
    } else if (data) {
      setUsuarios(data);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Carregando painel de usuários...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span>👥</span> Gerenciamento de Usuários
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Visualize e gerencie as contas com acesso ao sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              ← Voltar para a Home
            </Link>
          </div>
        </div>

        {/* Tabela de Listagem de Usuários */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-base">Usuários Registrados</h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              Total: {usuarios.length}
            </span>
          </div>

          {usuarios.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm">Nenhum usuário encontrado na tabela de perfis.</p>
              <p className="text-xs mt-1">Os cadastros realizados via login/registro aparecerão aqui após configurados no Supabase.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">E-mail</th>
                    <th className="px-6 py-3 font-semibold">Data de Criação</th>
                    <th className="px-6 py-3 font-semibold">Último Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{user.email}</td>
                      <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') 
                          : 'Nunca acessou'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}