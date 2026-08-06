'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function GestaoProcessos() {
  // --- ESTADOS DOS DADOS ---
  const [processos, setProcessos] = useState<any[]>([]);
  const [prazos, setPrazos] = useState<any[]>([]);
  const [andamentos, setAndamentos] = useState<any[]>([]);
  const [honorarios, setHonorarios] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // --- BUSCAR DADOS DO SUPABASE AO CARREGAR ---
  const carregarDados = async () => {
    setCarregando(true);
    try {
      const { data: procData } = await supabase.from('processos').select('*').order('created_at', { ascending: false });
      const { data: prazosData } = await supabase.from('prazos').select('*');
      const { data: andamData } = await supabase.from('andamentos').select('*');
      const { data: honorData } = await supabase.from('honorarios').select('*');

      if (procData) setProcessos(procData);
      if (prazosData) setPrazos(prazosData);
      if (andamData) setAndamentos(andamData);
      if (honorData) setHonorarios(honorData);
    } catch (error) {
      console.error('Erro ao carregar dados do Supabase:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // --- ESTADOS DE BUSCA E MODAIS ---
  const [busca, setBusca] = useState('');
  const [processoDetalhe, setProcessoDetalhe] = useState<any | null>(null);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);

  // --- FORMULÁRIO DE PROCESSO ---
  const [editProcessoId, setEditProcessoId] = useState<string | null>(null);
  const [numeroCnj, setNumeroCnj] = useState('');
  const [reclamante, setReclamante] = useState('');
  const [reclamada, setReclamada] = useState('');
  const [forum, setForum] = useState('');
  const [vara, setVara] = useState('');
  const [valorCausa, setValorCausa] = useState('');

  // --- FORMULÁRIO DE PRAZO ---
  const [processoIdPrazo, setProcessoIdPrazo] = useState('');
  const [tituloPrazo, setTituloPrazo] = useState('');
  const [vencimentoPrazo, setVencimentoPrazo] = useState('');

  // --- FORMULÁRIO DE ANDAMENTO ---
  const [processoIdAndamento, setProcessoIdAndamento] = useState('');
  const [tituloAndamento, setTituloAndamento] = useState('');
  const [descricaoAndamento, setDescricaoAndamento] = useState('');

  // --- FORMULÁRIO DE HONORÁRIO ---
  const [processoIdHonorario, setProcessoIdHonorario] = useState('');
  const [tipoHonorario, setTipoHonorario] = useState('');
  const [valorHonorario, setValorHonorario] = useState('');
  const [vencimentoHonorario, setVencimentoHonorario] = useState('');
  const [statusPagamento, setStatusPagamento] = useState('Pendente');

  // --- HANDLERS COM SUPABASE ---
  const handleSalvarProcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    const dados = {
      numero_cnj: numeroCnj,
      reclamante,
      reclamada,
      forum,
      vara,
      valor_causa: parseFloat(valorCausa) || 0,
    };

    if (editProcessoId) {
      await supabase.from('processos').update(dados).eq('id', editProcessoId);
    } else {
      await supabase.from('processos').insert([dados]);
    }

    limparFormProcesso();
    carregarDados();
  };

  const limparFormProcesso = () => {
    setEditProcessoId(null);
    setNumeroCnj('');
    setReclamante('');
    setReclamada('');
    setForum('');
    setVara('');
    setValorCausa('');
  };

  const prepararEdicaoProcesso = (proc: any) => {
    setEditProcessoId(proc.id);
    setNumeroCnj(proc.numero_cnj);
    setReclamante(proc.reclamante);
    setReclamada(proc.reclamada);
    setForum(proc.forum || '');
    setVara(proc.vara || '');
    setValorCausa(proc.valor_causa ? proc.valor_causa.toString() : '');
  };

  const excluirProcesso = async (id: string) => {
    if (confirm('Deseja realmente excluir este processo e todos os registros vinculados?')) {
      await supabase.from('processos').delete().eq('id', id);
      carregarDados();
    }
  };

  const handleSalvarPrazo = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('prazos').insert([{
      processo_id: processoIdPrazo,
      titulo: tituloPrazo,
      data_vencimento: vencimentoPrazo
    }]);

    setProcessoIdPrazo('');
    setTituloPrazo('');
    setVencimentoPrazo('');
    carregarDados();
    alert('Prazo salvo na nuvem com sucesso!');
  };

  const handleSalvarAndamento = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('andamentos').insert([{
      processo_id: processoIdAndamento,
      titulo: tituloAndamento,
      descricao: descricaoAndamento
    }]);

    setProcessoIdAndamento('');
    setTituloAndamento('');
    setDescricaoAndamento('');
    carregarDados();
  };

  const handleSalvarHonorario = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('honorarios').insert([{
      processo_id: processoIdHonorario,
      tipo: tipoHonorario,
      valor: parseFloat(valorHonorario) || 0,
      data_vencimento: vencimentoHonorario,
      status_pagamento: statusPagamento
    }]);

    setProcessoIdHonorario('');
    setTipoHonorario('');
    setValorHonorario('');
    setVencimentoHonorario('');
    setStatusPagamento('Pendente');
    carregarDados();
  };

  const processosFiltrados = processos.filter(p =>
    p.numero_cnj.toLowerCase().includes(busca.toLowerCase()) ||
    p.reclamante.toLowerCase().includes(busca.toLowerCase()) ||
    p.reclamada.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel de Gestão de Processos</h1>
            <p className="text-xs text-slate-500 mt-1">Conectado ao Supabase (Banco em Nuvem)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link 
              href="/prazos" 
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition shadow-sm flex items-center gap-2"
            >
              📅 Gerenciar & Editar Prazos
            </Link>
          </div>
        </header>

        {/* FORMULÁRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* FORM PROCESSO */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 border-slate-100">
              {editProcessoId ? 'Editar Processo' : 'Novo Processo'}
            </h2>
            <form onSubmit={handleSalvarProcesso} className="flex flex-col gap-2.5">
              <input type="text" placeholder="Número CNJ" value={numeroCnj} onChange={(e) => setNumeroCnj(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <input type="text" placeholder="Reclamante" value={reclamante} onChange={(e) => setReclamante(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <input type="text" placeholder="Reclamada" value={reclamada} onChange={(e) => setReclamada(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <input type="text" placeholder="Fórum" value={forum} onChange={(e) => setForum(e.target.value)} className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <input type="text" placeholder="Vara" value={vara} onChange={(e) => setVara(e.target.value)} className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <input type="number" step="0.01" placeholder="Valor da Causa (R$)" value={valorCausa} onChange={(e) => setValorCausa(e.target.value)} className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-2">
                {editProcessoId ? 'Atualizar Processo' : 'Cadastrar Processo'}
              </button>
            </form>
          </section>

          {/* FORM PRAZO */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 border-slate-100">Novo Prazo</h2>
            <form onSubmit={handleSalvarPrazo} className="flex flex-col gap-2.5">
              <select value={processoIdPrazo} onChange={(e) => setProcessoIdPrazo(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50">
                <option value="">-- Selecione o Processo --</option>
                {processos.map((proc) => (
                  <option key={proc.id} value={proc.id}>{proc.numero_cnj} - {proc.reclamante}</option>
                ))}
              </select>
              <input type="text" placeholder="Título do Prazo" value={tituloPrazo} onChange={(e) => setTituloPrazo(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <input type="date" value={vencimentoPrazo} onChange={(e) => setVencimentoPrazo(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-2">Lançar Prazo</button>
            </form>
          </section>

          {/* FORM ANDAMENTO */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 border-slate-100">Novo Andamento</h2>
            <form onSubmit={handleSalvarAndamento} className="flex flex-col gap-2.5">
              <select value={processoIdAndamento} onChange={(e) => setProcessoIdAndamento(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50">
                <option value="">-- Selecione o Processo --</option>
                {processos.map((proc) => (
                  <option key={proc.id} value={proc.id}>{proc.numero_cnj} - {proc.reclamante}</option>
                ))}
              </select>
              <input type="text" placeholder="Título / Ocorrência" value={tituloAndamento} onChange={(e) => setTituloAndamento(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <textarea placeholder="Descrição breve..." value={descricaoAndamento} onChange={(e) => setDescricaoAndamento(e.target.value)} rows={3} className="p-2.5 border rounded-lg text-xs bg-slate-50 resize-none" />
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-2">Lançar Andamento</button>
            </form>
          </section>

          {/* FORM HONORÁRIO */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 border-slate-100">Novo Honorário</h2>
            <form onSubmit={handleSalvarHonorario} className="flex flex-col gap-2.5">
              <select value={processoIdHonorario} onChange={(e) => setProcessoIdHonorario(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50">
                <option value="">-- Selecione o Processo --</option>
                {processos.map((proc) => (
                  <option key={proc.id} value={proc.id}>{proc.numero_cnj} - {proc.reclamante}</option>
                ))}
              </select>
              <input type="text" placeholder="Tipo (ex: Prévia, Pericial)" value={tipoHonorario} onChange={(e) => setTipoHonorario(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <input type="number" step="0.01" placeholder="Valor (R$)" value={valorHonorario} onChange={(e) => setValorHonorario(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <input type="date" value={vencimentoHonorario} onChange={(e) => setVencimentoHonorario(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
              <select value={statusPagamento} onChange={(e) => setStatusPagamento(e.target.value)} className="p-2.5 border rounded-lg text-xs bg-slate-50">
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
              </select>
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-2">Lançar Honorário</button>
            </form>
          </section>

        </div>

        {/* TABELA DE PROCESSOS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Processos Cadastrados</h2>
              <p className="text-xs text-slate-500">Listagem em tempo real sincronizada via nuvem</p>
            </div>
            <input
              type="text"
              placeholder="🔍 Buscar por CNJ, Reclamante..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full sm:w-72 p-2.5 border rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50">
                  <th className="py-3 px-4">CNJ</th>
                  <th className="py-3 px-4">Reclamante</th>
                  <th className="py-3 px-4">Reclamada</th>
                  <th className="py-3 px-4">Fórum / Vara</th>
                  <th className="py-3 px-4">Valor Causa</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {carregando ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">Carregando processos da nuvem...</td>
                  </tr>
                ) : processosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">Nenhum processo cadastrado na nuvem.</td>
                  </tr>
                ) : (
                  processosFiltrados.map((proc) => (
                    <tr key={proc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{proc.numero_cnj}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{proc.reclamante}</td>
                      <td className="py-3.5 px-4 text-slate-600">{proc.reclamada}</td>
                      <td className="py-3.5 px-4 text-slate-500">{proc.forum || '-'} / {proc.vara || '-'}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">R$ {(proc.valor_causa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => prepararEdicaoProcesso(proc)} className="text-slate-600 hover:text-slate-900 font-medium text-[11px]">Editar</button>
                          <button onClick={() => excluirProcesso(proc.id)} className="text-rose-600 hover:text-rose-800 font-medium text-[11px]">Excluir</button>
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