'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function GestaoPrazos() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Estados dos Prazos
  const [prazos, setPrazos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // Modal de Novo Prazo
  const [showModal, setShowModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [novoPrazo, setNovoPrazo] = useState({
    numero_processo: '',
    descricao: '',
    data_vencimento: '',
    status: 'Pendente',
    usuario_responsavel: ''
  });

  // Estado para Edição de Prazo
  const [prazoEditando, setPrazoEditando] = useState<any | null>(null);

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

  // CARREGAR PRAZOS DO SUPABASE
  async function carregarPrazos() {
    try {
      setLoading(true);
      setErro(null);

      const { data, error } = await supabase
        .from('prazos')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setPrazos(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar prazos:', err.message);
      setErro('Não foi possível carregar a lista de prazos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      carregarPrazos();
    }
  }, [session]);

  // ADICIONAR NOVO PRAZO
  async function handleSalvarPrazo(e: React.FormEvent) {
    e.preventDefault();
    if (!novoPrazo.descricao || !novoPrazo.data_vencimento) {
      alert('Descrição e Data de Vencimento são obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('prazos')
        .insert([{
          ...novoPrazo,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setNovoPrazo({
        numero_processo: '',
        descricao: '',
        data_vencimento: '',
        status: 'Pendente',
        usuario_responsavel: ''
      });
      setShowModal(false);
      carregarPrazos();
    } catch (err: any) {
      alert('Erro ao salvar prazo: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // EDITAR PRAZO EXISTENTE
  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!prazoEditando) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('prazos')
        .update({
          numero_processo: prazoEditando.numero_processo,
          descricao: prazoEditando.descricao,
          data_vencimento: prazoEditando.data_vencimento,
          status: prazoEditando.status,
          usuario_responsavel: prazoEditando.usuario_responsavel
        })
        .eq('id', prazoEditando.id);

      if (error) throw error;

      setPrazoEditando(null);
      carregarPrazos();
    } catch (err: any) {
      alert('Erro ao atualizar prazo: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // EXCLUIR PRAZO
  async function handleExcluir(id: string) {
    if (!confirm('Deseja realmente excluir este prazo?')) return;

    try {
      const { error } = await supabase
        .from('prazos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarPrazos();
    } catch (err: any) {
      alert('Erro ao excluir prazo: ' + err.message);
    }
  }

  // EXPORTAÇÃO EXCLUSIVA DE PRAZOS EM CSV
  function handleExportarPrazosCSV() {
    if (prazos.length === 0) {
      alert('Não há prazos para exportar.');
      return;
    }

    const headers = ['Processo', 'Descricao do Prazo', 'Data Vencimento', 'Status', 'Atribuido a'];
    const rows = prazos.map(p => [
      `"${p.numero_processo || ''}"`,
      `"${p.descricao || ''}"`,
      `"${p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString('pt-BR') : ''}"`,
      `"${p.status || ''}"`,
      `"${p.usuario_responsavel || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_prazos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // CÁLCULO DE STATUS DO PRAZO (Hoje / Vencido / No Prazo)
  function getPrazoStatusAlert(dataIso: string, status: string) {
    if (status === 'Concluído') {
      return { label: 'Concluído', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }

    if (!dataIso) return { label: 'Sem data', style: 'bg-slate-100 text-slate-600' };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataVenc = new Date(dataIso);
    dataVenc.setHours(0, 0, 0, 0);

    const diffTempo = dataVenc.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return { label: `Vencido há ${Math.abs(diffDias)} dia(s)`, style: 'bg-red-100 text-red-800 border-red-200' };
    } else if (diffDias === 0) {
      return { label: 'Vence HOJE!', style: 'bg-amber-100 text-amber-800 border-amber-200 font-bold' };
    } else if (diffDias <= 3) {
      return { label: `Vence em ${diffDias} dia(s)`, style: 'bg-amber-50 text-amber-700 border-amber-200' };
    } else {
      return { label: `No prazo (${diffDias} dias)`, style: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  }

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Carregando...</div>;
  }

  const prazosPendentes = prazos.filter(p => p.status !== 'Concluído');
  const prazosUrgentes = prazosPendentes.filter(p => {
    if (!p.data_vencimento) return false;
    const diff = new Date(p.data_vencimento).getTime() - new Date().setHours(0,0,0,0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 3;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Controle de Prazos Processuais</h1>
            <p className="text-slate-500 text-sm">Acompanhamento e alertas de vencimentos</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
            >
              ← Voltar para Processos
            </Link>
            <button
              onClick={handleExportarPrazosCSV}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors text-sm border border-emerald-200"
            >
              Exportar Prazos (CSV)
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm"
            >
              + Novo Prazo
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Prazos</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{prazos.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prazos Pendentes</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">{prazosPendentes.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Urgentes / Vencidos</span>
            <p className={`text-2xl font-bold mt-1 ${prazosUrgentes.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {prazosUrgentes.length}
            </p>
          </div>
        </div>

        {/* ALERTA DE ERRO */}
        {erro && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erro}
          </div>
        )}

        {/* TABELA DE PRAZOS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Cronograma de Prazos</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Carregando prazos...</div>
          ) : prazos.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-slate-500 text-base">Nenhum prazo cadastrado até o momento.</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 text-sm"
              >
                Cadastrar o primeiro prazo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-4 font-semibold">Processo</th>
                    <th className="p-4 font-semibold">Descrição</th>
                    <th className="p-4 font-semibold">Vencimento</th>
                    <th className="p-4 font-semibold">Responsável</th>
                    <th className="p-4 font-semibold">Status / Alerta</th>
                    <th className="p-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prazos.map((item) => {
                    const alerta = getPrazoStatusAlert(item.data_vencimento, item.status);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-800">{item.numero_processo || 'Geral / Não informado'}</td>
                        <td className="p-4 text-slate-700">{item.descricao}</td>
                        <td className="p-4 text-slate-600">
                          {item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="p-4 text-slate-600">{item.usuario_responsavel || '-'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${alerta.style}`}>
                            {alerta.label}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setPrazoEditando(item)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleExcluir(item.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE NOVO PRAZO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Cadastrar Novo Prazo</h3>

            <form onSubmit={handleSalvarPrazo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Número do Processo</label>
                <input
                  type="text"
                  placeholder="0000000-00.2026.5.02.0000"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={novoPrazo.numero_processo}
                  onChange={(e) => setNovoPrazo({ ...novoPrazo, numero_processo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Prazo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apresentar Réplica / Perícia"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={novoPrazo.descricao}
                  onChange={(e) => setNovoPrazo({ ...novoPrazo, descricao: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={novoPrazo.data_vencimento}
                    onChange={(e) => setNovoPrazo({ ...novoPrazo, data_vencimento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={novoPrazo.status}
                    onChange={(e) => setNovoPrazo({ ...novoPrazo, status: e.target.value })}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Responsável</label>
                <input
                  type="text"
                  placeholder="Nome do advogado ou perito"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={novoPrazo.usuario_responsavel}
                  onChange={(e) => setNovoPrazo({ ...novoPrazo, usuario_responsavel: e.target.value })}
                />
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
                  {saving ? 'Salvando...' : 'Salvar Prazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PRAZO */}
      {prazoEditando && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Editar Prazo</h3>

            <form onSubmit={handleSalvarEdicao} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Número do Processo</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={prazoEditando.numero_processo || ''}
                  onChange={(e) => setPrazoEditando({ ...prazoEditando, numero_processo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Prazo *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={prazoEditando.descricao || ''}
                  onChange={(e) => setPrazoEditando({ ...prazoEditando, descricao: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={prazoEditando.data_vencimento || ''}
                    onChange={(e) => setPrazoEditando({ ...prazoEditando, data_vencimento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={prazoEditando.status || 'Pendente'}
                    onChange={(e) => setPrazoEditando({ ...prazoEditando, status: e.target.value })}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Responsável</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={prazoEditando.usuario_responsavel || ''}
                  onChange={(e) => setPrazoEditando({ ...prazoEditando, usuario_responsavel: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPrazoEditando(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}