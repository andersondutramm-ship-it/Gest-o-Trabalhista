'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function GestaoPrazos() {
  const [prazos, setPrazos] = useState<any[]>([]);
  const [processos, setProcessos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [busca, setBusca] = useState('');

  // Formulário de Prazo
  const [editId, setEditId] = useState<string | null>(null);
  const [processoId, setProcessoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [vencimento, setVencimento] = useState('');

  // 1. CARREGAR DADOS DO SUPABASE (PRAZOS + PROCESSOS)
  const carregarDados = async () => {
    setCarregando(true);
    try {
      const { data: prazosData, error: errPrazos } = await supabase
        .from('prazos')
        .select('*')
        .order('data_vencimento', { ascending: true });

      const { data: procData, error: errProc } = await supabase
        .from('processos')
        .select('*');

      if (errPrazos) console.error('Erro ao carregar prazos:', errPrazos);
      if (errProc) console.error('Erro ao carregar processos:', errProc);

      if (prazosData) setPrazos(prazosData);
      if (procData) setProcessos(procData);
    } catch (error) {
      console.error('Erro geral ao conectar com o banco:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // 2. BUSCAR DADOS DO PROCESSO VINCULADO
  const obterDadosProcesso = (procId: string) => {
    const proc = processos.find((p) => String(p.id) === String(procId));
    if (!proc) {
      return { cnj: 'Sem Processo Vinculado', reclamante: '-' };
    }
    return {
      cnj: proc.numero_cnj || 'Sem CNJ',
      reclamante: proc.reclamante || '-'
    };
  };

  // 3. CALCULAR STATUS DINÂMICO BASEADO NO VENCIMENTO
  const calcularStatus = (dataVencimento: string, statusBanco?: string) => {
    if (statusBanco === 'Concluído') return 'Ok';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataVenc = new Date(dataVencimento + 'T00:00:00');

    if (isNaN(dataVenc.getTime())) return 'Ok';

    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffDias < 0) return 'Vencido';
    if (diffDias <= 3) return 'Crítico';
    if (diffDias <= 7) return 'Atenção';
    return 'Ok';
  };

  // 4. SALVAR / EDITAR PRAZO
  const handleSalvarPrazo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!processoId) {
      alert('Selecione um processo válido para vincular o prazo.');
      return;
    }

    const payload = {
      processo_id: processoId,
      titulo,
      data_vencimento: vencimento
    };

    if (editId) {
      await supabase.from('prazos').update(payload).eq('id', editId);
    } else {
      await supabase.from('prazos').insert([payload]);
    }

    limparFormulario();
    carregarDados();
  };

  const prepararEdicao = (prazo: any) => {
    setEditId(prazo.id);
    setProcessoId(prazo.processo_id || '');
    setTitulo(prazo.titulo || '');
    setVencimento(prazo.data_vencimento || '');
  };

  const excluirPrazo = async (id: string) => {
    if (confirm('Deseja realmente excluir este prazo?')) {
      await supabase.from('prazos').delete().eq('id', id);
      carregarDados();
    }
  };

  const limparFormulario = () => {
    setEditId(null);
    setProcessoId('');
    setTitulo('');
    setVencimento('');
  };

  // 5. FILTRAGEM
  const prazosCompletos = prazos.map((p) => {
    const infoProc = obterDadosProcesso(p.processo_id);
    const st = calcularStatus(p.data_vencimento, p.status);
    return { ...p, ...infoProc, statusCalculado: st };
  });

  const prazosFiltrados = prazosCompletos.filter((item) => {
    const bateFiltroStatus = filtroStatus === 'Todos' || item.statusCalculado.toLowerCase() === filtroStatus.toLowerCase();
    const buscaLower = busca.toLowerCase();
    const bateBusca =
      item.cnj.toLowerCase().includes(buscaLower) ||
      item.reclamante.toLowerCase().includes(buscaLower) ||
      item.titulo.toLowerCase().includes(buscaLower);

    return bateFiltroStatus && bateBusca;
  });

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition">
              ← Voltar ao Painel Principal
            </Link>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Gestão Central de Prazos</h1>
          </div>
        </header>

        {/* FORMULÁRIO */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase mb-4">
            {editId ? '✏️ Editar Prazo' : '➕ Novo Prazo'}
          </h2>
          <form onSubmit={handleSalvarPrazo} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={processoId}
              onChange={(e) => setProcessoId(e.target.value)}
              required
              className="p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none"
            >
              <option value="">-- Selecione o Processo --</option>
              {processos.map((proc) => (
                <option key={proc.id} value={proc.id}>
                  {proc.numero_cnj} ({proc.reclamante})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Título do Prazo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none"
            />

            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              required
              className="p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-sm"
              >
                {editId ? 'Atualizar' : 'Lançar'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-3 rounded-xl text-xs transition"
                >
                  X
                </button>
              )}
            </div>
          </form>
        </section>

        {/* CONTROLES E TABELA */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {/* ABAS DE STATUS */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl">
              {['Todos', 'Crítico', 'Atenção', 'Ok', 'Vencido'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltroStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filtroStatus === st
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* CAMPO DE BUSCA */}
            <input
              type="text"
              placeholder="🔍 Buscar por CNJ, Título..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full sm:w-64 p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          {/* TABELA DE PRAZOS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">CNJ / Reclamante</th>
                  <th className="py-3 px-4">Título do Prazo</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {carregando ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">Sincronizando prazos do Supabase...</td>
                  </tr>
                ) : prazosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">Nenhum prazo encontrado para este filtro.</td>
                  </tr>
                ) : (
                  prazosFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                            item.statusCalculado === 'Vencido' || item.statusCalculado === 'Crítico'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : item.statusCalculado === 'Atenção'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.statusCalculado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{item.cnj}</p>
                        <p className="text-[11px] text-slate-500">{item.reclamante}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{item.titulo}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{item.data_vencimento}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => prepararEdicao(item)} className="text-slate-600 hover:text-slate-900 font-bold text-[11px]">Editar</button>
                          <button onClick={() => excluirPrazo(item.id)} className="text-rose-600 hover:text-rose-800 font-bold text-[11px]">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}