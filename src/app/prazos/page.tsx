'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Trash2, ArrowLeft, Clock } from 'lucide-react';

interface Processo {
  id: string;
  numero: string;
  reclamante?: string;
  parte?: string;
}

interface Prazo {
  id: string;
  processo_id: string;
  descricao: string;
  data_fatal: string;
  status: string;
  processos?: Processo;
}

export default function PrazosPage() {
  const [loading, setLoading] = useState(true);
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [modalAberto, setModalAberto] = useState(false);

  // Campos do formulário
  const [processoId, setProcessoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataFatal, setDataFatal] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    
    // 1. Carrega os processos para popular o select
    const { data: dataProcessos } = await supabase.from('processos').select('*');
    if (dataProcessos) setProcessos(dataProcessos);

    // 2. Carrega os prazos trazendo também os dados do processo associado
    const { data: dataPrazos, error } = await supabase
      .from('prazos')
      .select(`
        *,
        processos (
          id,
          numero,
          reclamante,
          parte
        )
      `)
      .order('data_fatal', { ascending: true });

    if (error) {
      console.error('Erro ao carregar prazos:', error);
    } else if (dataPrazos) {
      setPrazos(dataPrazos);
    }

    setLoading(false);
  }

  async function handleSalvarPrazo(e: React.FormEvent) {
    e.preventDefault();
    if (!processoId) {
      alert('Selecione um processo.');
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase.from('prazos').insert([{
        processo_id: processoId,
        descricao,
        data_fatal: dataFatal,
        status: 'Pendente'
      }]);

      if (error) throw error;

      alert('Prazo cadastrado com sucesso!');
      setModalAberto(false);
      setProcessoId('');
      setDescricao('');
      setDataFatal('');
      carregarDados();
    } catch (error: any) {
      alert('Erro ao salvar prazo: ' + error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirPrazo(id: string) {
    if (!confirm('Deseja realmente excluir este prazo?')) return;

    const { error } = await supabase.from('prazos').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      carregarDados();
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4 shadow-xl">
          <div>
            <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2 font-serif uppercase tracking-wider">
              <Calendar className="w-6 h-6" /> Controle de Prazos
            </h1>
            <p className="text-xs text-neutral-400 mt-1">Gerencie os prazos processuais e datas fatais</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setModalAberto(true)} 
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/20 uppercase tracking-wider transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Prazo
            </button>
            <Link href="/" className="px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
          </div>
        </div>

        {/* TABELA DE PRAZOS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Processo / Parte</th>
                <th className="px-6 py-4">Descrição do Prazo</th>
                <th className="px-6 py-4">Data Fatal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-neutral-500">Carregando prazos...</td>
                </tr>
              ) : prazos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-neutral-500">Nenhum prazo cadastrado.</td>
                </tr>
              ) : (
                prazos.map((p) => {
                  const proc = p.processos;
                  const nomeParte = proc?.reclamante || proc?.parte || 'Sem Parte Informada';
                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-neutral-200">{proc?.numero || 'N/A'}</div>
                        <div className="text-[11px] text-amber-400/90">{nomeParte}</div>
                      </td>
                      <td className="px-6 py-4 text-neutral-300">{p.descricao}</td>
                      <td className="px-6 py-4 font-mono text-neutral-200">
                        {p.data_fatal ? new Date(p.data_fatal + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 text-amber-400 rounded-md text-[10px] flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> {p.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleExcluirPrazo(p.id)} 
                          className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE NOVO PRAZO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Calendar className="w-5 h-5 text-amber-400" /> Cadastrar Novo Prazo
            </h2>
            
            <form onSubmit={handleSalvarPrazo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Processo *</label>
                <select 
                  value={processoId} 
                  onChange={(e) => setProcessoId(e.target.value)} 
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione o Processo</option>
                  {processos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numero} - {p.reclamante || p.parte || 'Sem Parte Informada'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Descrição do Prazo *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Apresentação de Contestação" 
                  required 
                  value={descricao} 
                  onChange={(e) => setDescricao(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Data Fatal *</label>
                <input 
                  type="date" 
                  required 
                  value={dataFatal} 
                  onChange={(e) => setDataFatal(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button 
                  type="button" 
                  onClick={() => setModalAberto(false)} 
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={salvando} 
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 uppercase tracking-wider transition-all"
                >
                  {salvando ? 'Salvando...' : 'Salvar Prazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}