'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function GestaoPrazos() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  const [prazos, setPrazos] = useState<any[]>([]);
  const [processos, setProcessos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [busca, setBusca] = useState<string>('');

  // Formulário de Novo Prazo
  const [processoId, setProcessoId] = useState<string>('');
  const [titulo, setTitulo] = useState<string>('');
  const [vencimento, setVencimento] = useState<string>('');
  const [salvando, setSalvando] = useState<boolean>(false);

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

  async function carregarDados() {
    try {
      setLoading(true);

      const { data: procData } = await supabase.from('processos').select('id, numero, reclamante');
      setProcessos(procData || []);

      const { data: prazosData, error } = await supabase
        .from('prazos')
        .select('*, processos(numero, reclamante)')
        .order('vencimento', { ascending: true });

      if (error) throw error;
      setPrazos(prazosData || []);
    } catch (err: any) {
      console.error('Erro ao carregar prazos:', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      carregarDados();
    }
  }, [session]);

  // ALTERAR STATUS CONCLUÍDO
  async function handleToggleConcluido(id: string, concluidoAtual: boolean) {
    try {
      const { error } = await supabase
        .from('prazos')
        .update({ concluido: !concluidoAtual })
        .eq('id', id);

      if (error) throw error;
      carregarDados();
    } catch (err: any) {
      alert('Erro ao atualizar o prazo: ' + err.message);
    }
  }

  // CRIAR PRAZO
  async function handleCriarPrazo(e: React.FormEvent) {
    e.preventDefault();
    if (!processoId || !titulo || !vencimento) {
      alert('Preencha todos os campos.');
      return;
    }

    try {
      setSalvando(true);
      const { error } = await supabase.from('prazos').insert([{
        processo_id: processoId,
        titulo,
        vencimento,
        concluido: false
      }]);

      if (error) throw error;

      setTitulo('');
      setVencimento('');
      setProcessoId('');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao lançar prazo: ' + err.message);
    } finally {
      setSalvando(false);
    }
  }

  // EXCLUIR PRAZO
  async function handleExcluirPrazo(id: string) {
    if (!confirm('Deseja excluir este prazo?')) return;
    try {
      const { error } = await supabase.from('prazos').delete().eq('id', id);
      if (error) throw error;
      carregarDados();
    } catch (err: any) {
      alert('Erro ao excluir prazo: ' + err.message);
    }
  }

  // CÁLCULO DE STATUS DO PRAZO
  function getStatusPrazo(vencimentoStr: string, concluido: boolean) {
    if (concluido) return { label: 'CONCLUÍDO', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(vencimentoStr + 'T00:00:00');

    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffDias < 0) return { label: 'VENCIDO', color: 'bg-red-100 text-red-800 border-red-200' };
    if (diffDias <= 2) return { label: 'CRÍTICO', color: 'bg-red-50 text-red-600 border-red-200' };
    if (diffDias <= 5) return { label: 'ATENÇÃO', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'OK', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  }

  // FILTRAGEM
  const prazosFiltrados = prazos.filter(p => {
    const status = getStatusPrazo(p.vencimento, p.concluido).label;
    const matchFiltro = 
      filtroStatus === 'Todos' ||
      (filtroStatus === 'Concluídos' && p.concluido) ||
      (filtroStatus === 'Crítico' && status === 'CRÍTICO') ||
      (filtroStatus === 'Atenção' && status === 'ATENÇÃO') ||
      (filtroStatus === 'Ok' && status === 'OK') ||
      (filtroStatus === 'Vencido' && status === 'VENCIDO');

    const termo = busca.toLowerCase();
    const cnj = p.processos?.numero?.toLowerCase() || '';
    const reclamante = p.processos?.reclamante?.toLowerCase() || '';
    const tit = p.titulo?.toLowerCase() || '';
    const matchBusca = cnj.includes(termo) || reclamante.includes(termo) || tit.includes(termo);

    return matchFiltro && matchBusca;
  });

  if (loadingAuth) return <div className="p-8 text-center text-slate-500">Carregando...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <Link href="/" className="text-xs text-blue-600 hover:underline font-semibold block mb-1">
              ← Voltar ao Painel Principal
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Gestão Central de Prazos</h1>
          </div>
        </div>

        {/* NOVO PRAZO */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">+ Novo Prazo</h2>
          <form onSubmit={handleCriarPrazo} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              className="p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
              value={processoId}
              onChange={(e) => setProcessoId(e.target.value)}
              required
            >
              <option value="">-- Selecione o Processo --</option>
              {processos.map(proc => (
                <option key={proc.id} value={proc.id}>
                  {proc.numero ? `${proc.numero} - ${proc.reclamante || ''}` : proc.reclamante || 'Sem número'}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Título do Prazo (ex: Manifestação)"
              className="p-2.5 border border-slate-300 rounded-lg text-sm"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />

            <input
              type="date"
              className="p-2.5 border border-slate-300 rounded-lg text-sm"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={salvando}
              className="bg-slate-900 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-slate-800 text-sm transition-colors"
            >
              {salvando ? 'Lançando...' : 'Lançar'}
            </button>
          </form>
        </div>

        {/* TABELA DE PRAZOS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {['Todos', 'Crítico', 'Atenção', 'Ok', 'Vencido', 'Concluídos'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFiltroStatus(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filtroStatus === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Buscar por CNJ, Título..."
              className="p-2 border border-slate-300 rounded-lg text-xs w-full md:w-64"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Carregando prazos...</div>
          ) : prazosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Nenhum prazo encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
                    <th className="p-4">Concluído</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">CNJ / Reclamante</th>
                    <th className="p-4">Título do Prazo</th>
                    <th className="p-4">Vencimento</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prazosFiltrados.map(item => {
                    const statusInfo = getStatusPrazo(item.vencimento, item.concluido);
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${item.concluido ? 'opacity-60 bg-slate-50/50' : ''}`}>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={!!item.concluido}
                            onChange={() => handleToggleConcluido(item.id, !!item.concluido)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className={`font-semibold text-slate-800 ${item.concluido ? 'line-through' : ''}`}>
                            {item.processos?.numero || 'Sem CNJ'}
                          </p>
                          <p className="text-xs text-slate-500">{item.processos?.reclamante || '-'}</p>
                        </td>
                        <td className={`p-4 font-medium text-slate-700 ${item.concluido ? 'line-through' : ''}`}>
                          {item.titulo}
                        </td>
                        <td className="p-4 font-semibold text-slate-800">
                          {new Date(item.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleExcluirPrazo(item.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
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
    </main>
  );
}