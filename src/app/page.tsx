'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function GestaoProcessos() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Estados de Autenticação
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estados dos Processos
  const [processos, setProcessos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Modal de cadastro
  const [showModal, setShowModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [novoProcesso, setNovoProcesso] = useState({
    numero: '',
    reclamante: '',
    reclamada: '',
    valor_causa: '',
    honorarios: '',
    status: 'Em andamento'
  });

  // VERIFICAR SESSÃO DO USUÁRIO
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // CARREGAR DADOS DO SUPABASE
  async function carregarProcessos() {
    try {
      setLoading(true);
      setErro(null);

      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcessos(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar processos:', err.message);
      setErro('Não foi possível carregar os processos do banco.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      carregarProcessos();
    }
  }, [session]);

  // LOGIN E CADASTRO
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu e-mail se a confirmação estiver ativada.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  }

  // LOGOUT
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // ADICIONAR NOVO PROCESSO
  async function handleSalvarProcesso(e: React.FormEvent) {
    e.preventDefault();
    if (!novoProcesso.numero) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('processos')
        .insert([{
          ...novoProcesso,
          valor_causa: novoProcesso.valor_causa ? parseFloat(novoProcesso.valor_causa) : 0,
          honorarios: novoProcesso.honorarios ? parseFloat(novoProcesso.honorarios) : 0
        }]);

      if (error) throw error;

      setNovoProcesso({ numero: '', reclamante: '', reclamada: '', valor_causa: '', honorarios: '', status: 'Em andamento' });
      setShowModal(false);
      carregarProcessos();
    } catch (err: any) {
      alert('Erro ao salvar processo: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // EXCLUIR PROCESSO
  async function handleExcluir(id: string) {
    if (!confirm('Deseja realmente excluir este processo?')) return;

    try {
      const { error } = await supabase
        .from('processos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarProcessos();
    } catch (err: any) {
      alert('Erro ao excluir processo: ' + err.message);
    }
  }

  // EXPORTAR DADOS EM CSV
  function handleExportarCSV() {
    if (processos.length === 0) {
      alert('Não há processos para exportar.');
      return;
    }

    const headers = ['Numero', 'Reclamante', 'Reclamada', 'Valor da Causa (R$)', 'Honorarios (R$)', 'Status', 'Data de Criacao'];
    const rows = processos.map(p => [
      `"${p.numero || ''}"`,
      `"${p.reclamante || ''}"`,
      `"${p.reclamada || ''}"`,
      `"${p.valor_causa || 0}"`,
      `"${p.honorarios || 0}"`,
      `"${p.status || ''}"`,
      `"${p.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `processos_trabalhistas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Carregando...</div>;
  }

  // TELA DE LOGIN / SEGURANÇA
  if (!session) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800">Gestão Trabalhista</h1>
            <p className="text-slate-500 text-sm mt-1">
              {isSignUp ? 'Crie sua conta para acessar' : 'Acesse com seu e-mail e senha'}
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
              <input
                type="email"
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Senha</label>
              <input
                type="password"
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm transition-colors"
            >
              {isSignUp ? 'Cadastrar Conta' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // TELA PRINCIPAL
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestão Trabalhista</h1>
            <p className="text-slate-500 text-sm">Usuário: {session.user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportarCSV}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors text-sm border border-emerald-200"
            >
              Exportar CSV
            </button>
            <Link 
              href="/prazos"
              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
            >
              Ver Prazos
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm"
            >
              + Novo Processo
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-slate-100 text-slate-500 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
            >
              Sair
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Processos</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{processos.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Em Andamento</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {processos.filter(p => p.status === 'Em andamento' || !p.status).length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Valor da Causa</span>
            <p className="text-xl font-bold text-slate-800 mt-1">
              R$ {processos.reduce((acc, p) => acc + (Number(p.valor_causa) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Honorários</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              R$ {processos.reduce((acc, p) => acc + (Number(p.honorarios) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ALERTA DE ERRO */}
        {erro && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erro}
          </div>
        )}

        {/* TABELA DE PROCESSOS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Processos Cadastrados</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Carregando processos...</div>
          ) : processos.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-slate-500 text-base">Nenhum processo encontrado no banco de dados.</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 text-sm"
              >
                Cadastrar o primeiro processo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-4 font-semibold">Número</th>
                    <th className="p-4 font-semibold">Reclamante</th>
                    <th className="p-4 font-semibold">Reclamada</th>
                    <th className="p-4 font-semibold">Valor da Causa</th>
                    <th className="p-4 font-semibold">Honorários</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processos.map((proc) => (
                    <tr key={proc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{proc.numero || 'N/A'}</td>
                      <td className="p-4 text-slate-600">{proc.reclamante || '-'}</td>
                      <td className="p-4 text-slate-600">{proc.reclamada || '-'}</td>
                      <td className="p-4 text-slate-600">
                        {proc.valor_causa ? `R$ ${Number(proc.valor_causa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="p-4 text-emerald-600 font-medium">
                        {proc.honorarios ? `R$ ${Number(proc.honorarios).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          proc.status === 'Encerrado' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {proc.status || 'Em andamento'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleExcluir(proc.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE CADASTRO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Novo Processo</h3>
            
            <form onSubmit={handleSalvarProcesso} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Número do Processo *</label>
                <input
                  type="text"
                  required
                  placeholder="0000000-00.2026.5.02.0000"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={novoProcesso.numero}
                  onChange={(e) => setNovoProcesso({ ...novoProcesso, numero: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reclamante</label>
                <input
                  type="text"
                  placeholder="Nome do reclamante"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={novoProcesso.reclamante}
                  onChange={(e) => setNovoProcesso({ ...novoProcesso, reclamante: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reclamada</label>
                <input
                  type="text"
                  placeholder="Nome da empresa / reclamada"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={novoProcesso.reclamada}
                  onChange={(e) => setNovoProcesso({ ...novoProcesso, reclamada: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Valor da Causa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={novoProcesso.valor_causa}
                    onChange={(e) => setNovoProcesso({ ...novoProcesso, valor_causa: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Honorários (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={novoProcesso.honorarios}
                    onChange={(e) => setNovoProcesso({ ...novoProcesso, honorarios: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={novoProcesso.status}
                  onChange={(e) => setNovoProcesso({ ...novoProcesso, status: e.target.value })}
                >
                  <option value="Em andamento">Em andamento</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}