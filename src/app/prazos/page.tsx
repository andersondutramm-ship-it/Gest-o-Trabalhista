'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Edit3, Trash2, ArrowLeft, Clock, AlertCircle } from 'lucide-react';

interface Prazo {
  id: string;
  processo_numero: string;
  descricao: string;
  data_vencimento: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
}

export default function PrazosPage() {
  const [loading, setLoading] = useState(true);
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [prazoEditando, setPrazoEditando] = useState<Prazo | null>(null);

  // Form State
  const [processoNumero, setProcessoNumero] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Em Andamento' | 'Concluído'>('Pendente');

  useEffect(() => {
    carregarPrazos();
  }, []);

  async function carregarPrazos() {
    setLoading(true);
    const { data } = await supabase
      .from('prazos')
      .select('*')
      .order('data_vencimento', { ascending: true });

    if (data) setPrazos(data);
    setLoading(false);
  }

  function abrirModalCriar() {
    setPrazoEditando(null);
    setProcessoNumero('');
    setDescricao('');
    setDataVencimento('');
    setStatus('Pendente');
    setModalAberto(true);
  }

  function abrirModalEditar(p: Prazo) {
    setPrazoEditando(p);
    setProcessoNumero(p.processo_numero || '');
    setDescricao(p.descricao);
    setDataVencimento(p.data_vencimento);
    setStatus(p.status);
    setModalAberto(true);
  }

  async function handleSalvarPrazo(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      processo_numero: processoNumero,
      descricao,
      data_vencimento: dataVencimento,
      status,
    };

    if (prazoEditando) {
      await supabase.from('prazos').update(payload).eq('id', prazoEditando.id);
    } else {
      await supabase.from('prazos').insert([payload]);
    }

    setModalAberto(false);
    carregarPrazos();
  }

  async function handleExcluirPrazo(id: string) {
    if (!confirm('Excluir este prazo?')) return;
    await supabase.from('prazos').delete().eq('id', id);
    carregarPrazos();
  }

  function calcularUrgencia(dataIso: string) {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const vencimento = new Date(dataIso + 'T00:00:00');
    const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { label: 'URGENTE / HOJE', class: 'bg-red-500/10 text-red-400 border-red-500/30' };
    if (diffDays <= 3) return { label: `PRÓXIMO (${diffDays}d)`, class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { label: 'NORMAL', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2 font-serif uppercase tracking-wider">
              <Calendar className="w-6 h-6" /> Gestão de Prazos Processuais
            </h1>
            <p className="text-xs text-neutral-400 mt-1">Acompanhamento e controle de prazos críticos</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={abrirModalCriar}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/20 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> Cadastrar Prazo
            </button>

            <Link href="/" className="px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
            </Link>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 uppercase font-semibold border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4">Processo</th>
                <th className="px-6 py-4">Descrição do Prazo</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Urgência</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-neutral-500">Carregando prazos...</td></tr>
              ) : prazos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-neutral-500">Nenhum prazo cadastrado.</td></tr>
              ) : (
                prazos.map((p) => {
                  const urg = calcularUrgencia(p.data_vencimento);
                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-neutral-200">{p.processo_numero || '-'}</td>
                      <td className="px-6 py-4">{p.descricao}</td>
                      <td className="px-6 py-4 font-bold text-neutral-200">
                        {new Date(p.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold ${urg.class}`}>
                          {urg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-md text-[10px]">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => abrirModalEditar(p)} className="p-1.5 text-neutral-400 hover:text-amber-400">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleExcluirPrazo(p.id)} className="p-1.5 text-neutral-400 hover:text-red-400">
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

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-neutral-100">{prazoEditando ? 'Editar Prazo' : 'Novo Prazo'}</h2>
            <form onSubmit={handleSalvarPrazo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Número do Processo</label>
                <input
                  type="text"
                  value={processoNumero}
                  onChange={(e) => setProcessoNumero(e.target.value)}
                  placeholder="0000000-00.2026.5.02.0000"
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Descrição do Prazo *</label>
                <input
                  type="text"
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Réplica à Contestação"
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Data de Vencimento *</label>
                <input
                  type="date"
                  required
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
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
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 uppercase tracking-wider"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}