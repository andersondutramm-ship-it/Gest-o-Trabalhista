'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Scale, Users, Calendar, LogOut, Plus, Search, 
  FileSpreadsheet, Edit3, Trash2, AlertTriangle, FileText, X
} from 'lucide-react';

interface Processo {
  id: string;
  numero_processo: string;
  reclamante: string;
  reclamada: string;
  valor_causa: number;
  honorarios: number;
  status: string;
  observacoes?: string;
  ultima_movimentacao: string;
}

export default function DashboardProcessosPage() {
  const [loading, setLoading] = useState(true);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [busca, setBusca] = useState('');

  // Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [processoEditando, setProcessoEditando] = useState<Processo | null>(null);

  // Form State
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [reclamante, setReclamante] = useState('');
  const [reclamada, setReclamada] = useState('');
  const [valorCausa, setValorCausa] = useState('');
  const [honorarios, setHonorarios] = useState('');
  const [status, setStatus] = useState('Em andamento');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarProcessos();
  }, []);

  async function carregarProcessos() {
    setLoading(true);
    const { data } = await supabase
      .from('processos')
      .select('*')
      .order('reclamante', { ascending: true }); // Ordenação alfabética pelo Reclamante

    if (data) setProcessos(data);
    setLoading(false);
  }

  function abrirModalCriar() {
    setProcessoEditando(null);
    setNumeroProcesso('');
    setReclamante('');
    setReclamada('');
    setValorCausa('');
    setHonorarios('');
    setStatus('Em andamento');
    setObservacoes('');
    setModalAberto(true);
  }

  function abrirModalEditar(proc: Processo) {
    setProcessoEditando(proc);
    setNumeroProcesso(proc.numero_processo);
    setReclamante(proc.reclamante);
    setReclamada(proc.reclamada);
    setValorCausa(String(proc.valor_causa));
    setHonorarios(String(proc.honorarios));
    setStatus(proc.status);
    setObservacoes(proc.observacoes || '');
    setModalAberto(true);
  }

  async function handleSalvarProcesso(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    const payload = {
      numero_processo: numeroProcesso,
      reclamante,
      reclamada,
      valor_causa: parseFloat(valorCausa) || 0,
      honorarios: parseFloat(honorarios) || 0,
      status,
      observacoes,
      ultima_movimentacao: new Date().toISOString()
    };

    if (processoEditando) {
      await supabase.from('processos').update(payload).eq('id', processoEditando.id);
    } else {
      await supabase.from('processos').insert([payload]);
    }

    setSalvando(false);
    setModalAberto(false);
    carregarProcessos();
  }

  async function handleExcluirProcesso(id: string) {
    if (!confirm('Tem certeza que deseja excluir este processo?')) return;
    await supabase.from('processos').delete().eq('id', id);
    carregarProcessos();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  function exportarCSV() {
    const header = "Numero do Processo,Reclamante,Reclamada,Valor Causa,Honorarios,Status\n";
    const rows = processos.map(p => 
      `"${p.numero_processo}","${p.reclamante}","${p.reclamada}",${p.valor_causa},${p.honorarios},"${p.status}"`
    ).join("\n");

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `processos_trabalhistas_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function estaParadoMais60Dias(dataIso: string) {
    const diffTime = Math.abs(new Date().getTime() - new Date(dataIso).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 60;
  }

  const processosFiltrados = processos.filter(p => 
    p.reclamante.toLowerCase().includes(busca.toLowerCase()) ||
    p.numero_processo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      
      {/* CABEÇALHO SUPERIOR DA BANDEIRA */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-neutral-900 border border-amber-500/40 text-amber-400">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide uppercase font-serif text-amber-400">
                Gestão de Processos Trabalhistas
              </h1>
              <p className="text-[11px] text-neutral-400">Painel Principal & Controle Jurídico</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={exportarCSV}
              className="px-3.5 py-2 bg-emerald-950 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Exportar CSV
            </button>

            <Link href="/prazos" className="px-3.5 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all">
              <Calendar className="w-4 h-4 text-amber-400" /> Prazos
            </Link>

            <Link href="/admin/usuarios" className="px-3.5 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all">
              <Users className="w-4 h-4 text-amber-400" /> Usuários
            </Link>

            <button 
              onClick={abrirModalCriar}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> Novo Processo
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-red-400 rounded-xl transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* BARRA DE PESQUISA */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por Reclamante ou Número do Processo..."
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            Exibindo: <strong className="text-amber-400">{processosFiltrados.length}</strong> processos
          </span>
        </div>

        {/* TABELA DE PROCESSOS */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-semibold border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4">Processo</th>
                  <th className="px-6 py-4">Reclamante</th>
                  <th className="px-6 py-4">Reclamada</th>
                  <th className="px-6 py-4">Valor / Honorários</th>
                  <th className="px-6 py-4">Status & Alertas</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-neutral-500">Carregando acervo processual...</td>
                  </tr>
                ) : processosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-neutral-500">Nenhum processo encontrado.</td>
                  </tr>
                ) : (
                  processosFiltrados.map((p) => {
                    const parado = estaParadoMais60Dias(p.ultima_movimentacao);
                    return (
                      <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-neutral-200">
                          {p.numero_processo}
                          {p.observacoes && (
                            <div className="text-[10px] text-neutral-400 font-normal mt-1 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate max-w-xs">{p.observacoes}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-400/90 uppercase">{p.reclamante}</td>
                        <td className="px-6 py-4 uppercase text-neutral-300">{p.reclamada}</td>
                        <td className="px-6 py-4">
                          <div>Causa: <span className="text-neutral-200 font-semibold">R$ {p.valor_causa.toLocaleString('pt-BR')}</span></div>
                          <div className="text-[10px] text-emerald-400">Honorários: R$ {p.honorarios.toLocaleString('pt-BR')}</div>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <span className="inline-block px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium">
                            {p.status}
                          </span>
                          {parado && (
                            <div className="inline-flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md font-bold">
                              <AlertTriangle className="w-3 h-3" /> Parado +60 dias
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => abrirModalEditar(p)}
                              className="p-1.5 text-neutral-400 hover:text-amber-400 rounded-lg hover:bg-neutral-800 transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExcluirProcesso(p.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* MODAL NOVO / EDITAR PROCESSO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setModalAberto(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Scale className="w-5 h-5 text-amber-400" />
              {processoEditando ? 'Editar Processo' : 'Novo Processo Trabalhista'}
            </h2>

            <form onSubmit={handleSalvarProcesso} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Número do Processo *</label>
                  <input
                    type="text"
                    required
                    value={numeroProcesso}
                    onChange={(e) => setNumeroProcesso(e.target.value)}
                    placeholder="0000000-00.2026.5.02.0000"
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Em andamento">Em andamento</option>
                    <option value="Aguardando Audiência">Aguardando Audiência</option>
                    <option value="Recurso">Recurso</option>
                    <option value="Execução">Execução</option>
                    <option value="Arquivado">Arquivado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Reclamante (Autor) *</label>
                  <input
                    type="text"
                    required
                    value={reclamante}
                    onChange={(e) => setReclamante(e.target.value)}
                    placeholder="Nome completo do reclamante"
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Reclamada (Réu) *</label>
                  <input
                    type="text"
                    required
                    value={reclamada}
                    onChange={(e) => setReclamada(e.target.value)}
                    placeholder="Nome da empresa / réu"
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Valor da Causa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={valorCausa}
                    onChange={(e) => setValorCausa(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Honorários Estimados (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={honorarios}
                    onChange={(e) => setHonorarios(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Observações / Anotações Internas</label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Anotações sobre prazos, audiências e acordos..."
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 uppercase tracking-wider"
                >
                  {salvando ? 'Salvando...' : 'Salvar Processo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}