'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuarioAtual, setUsuarioAtual] = useState<any>(null);

  // Estado do Modal de Cadastro de Usuário
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('operador');
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  async function verificarAutenticacao() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    setUsuarioAtual(session.user);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleCadastrarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoUsuario(true);

    try {
      // Cria o usuário na autenticação do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome, role },
        },
      });

      if (authError) throw authError;

      // Garante a inserção na tabela de perfis
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          email,
          nome,
          role,
        });

        if (profileError) console.warn('Aviso ao sincronizar perfil:', profileError.message);
      }

      alert('Usuário cadastrado com sucesso!');
      setModalUsuarioAberto(false);
      setNome('');
      setEmail('');
      setSenha('');
      setRole('operador');
    } catch (err: any) {
      alert('Erro ao cadastrar usuário: ' + (err.message || err));
    } finally {
      setSalvandoUsuario(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Verificando permissões de acesso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Sistema de Gestão Processual</h1>
            <p className="text-xs text-slate-500 mt-1">
              Sessão ativa: <span className="font-semibold text-slate-700">{usuarioAtual?.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setModalUsuarioAberto(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <span>+</span> Cadastrar Usuário
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Cards Principais de Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/prazos"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
              📅
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              Gestão de Prazos
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Acompanhe intimações, vencimentos e datas importantes dos processos.
            </p>
          </Link>

          <Link
            href="/processos"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
              ⚖️
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
              Processos
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Cadastre e gerencie o histórico completo das ações judiciais.
            </p>
          </Link>

          <Link
            href="/admin/usuarios"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
              👥
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
              Painel de Usuários
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Visualize, edite níveis de permissão ou remova usuários cadastrados.
            </p>
          </Link>
        </div>
      </div>

      {/* Modal para Novo Usuário */}
      {modalUsuarioAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Cadastrar Novo Usuário</h2>
            <p className="text-xs text-slate-500">
              Cadastre um novo membro para conceder acesso ao sistema privado.
            </p>

            <form onSubmit={handleCadastrarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ana Souza"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail de Acesso *</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Senha Inicial *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nível de Permissão</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="operador">Operador (Acesso padrão)</option>
                  <option value="admin">Administrador (Acesso total)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalUsuarioAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoUsuario}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow transition-colors disabled:opacity-50"
                >
                  {salvandoUsuario ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}