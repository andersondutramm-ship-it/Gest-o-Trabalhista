'use client';

import React, { useState } from 'react';

export default function GestaoProcessos() {
  // --- ESTADOS DOS DADOS ---
  const [processos, setProcessos] = useState<any[]>([]);
  const [prazos, setPrazos] = useState<any[]>([]);
  const [andamentos, setAndamentos] = useState<any[]>([]);
  const [honorarios, setHonorarios] = useState<any[]>([]);

  // --- ESTADOS DE BUSCA E FILTROS ---
  const [busca, setBusca] = useState('');
  const [filtroUrgenciaPrazo, setFiltroUrgenciaPrazo] = useState('todos');

  // --- ESTADOS DOS MODAIS ---
  const [processoDetalhe, setProcessoDetalhe] = useState<any | null>(null);
  const [modalTodosPrazosAberto, setModalTodosPrazosAberto] = useState(false);
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
  const [editPrazoId, setEditPrazoId] = useState<string | null>(null);
  const [processoIdPrazo, setProcessoIdPrazo] = useState('');
  const [tituloPrazo, setTituloPrazo] = useState('');
  const [vencimentoPrazo, setVencimentoPrazo] = useState('');

  // --- FORMULÁRIO DE ANDAMENTO ---
  const [editAndamentoId, setEditAndamentoId] = useState<string | null>(null);
  const [processoIdAndamento, setProcessoIdAndamento] = useState('');
  const [tituloAndamento, setTituloAndamento] = useState('');
  const [descricaoAndamento, setDescricaoAndamento] = useState('');

  // --- FORMULÁRIO DE HONORÁRIO ---
  const [editHonorarioId, setEditHonorarioId] = useState<string | null>(null);
  const [processoIdHonorario, setProcessoIdHonorario] = useState('');
  const [tipoHonorario, setTipoHonorario] = useState('');
  const [valorHonorario, setValorHonorario] = useState('');
  const [vencimentoHonorario, setVencimentoHonorario] = useState('');
  const [statusPagamento, setStatusPagamento] = useState('Pendente');

  // --- SEGURANÇA / SENHA ---
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [confirmaSenhaInput, setConfirmaSenhaInput] = useState('');

  // --- AUXILIARES E CÁLCULOS ---
  const calcularUrgencia = (dataStr: string) => {
    if (!dataStr) return { texto: 'Sem Data', badge: 'bg-slate-100 text-slate-700 border-slate-300', cardBorder: 'border-l-slate-300' };
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(dataStr);
    dataVenc.setHours(0, 0, 0, 0);

    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return { texto: 'Vencido', badge: 'bg-rose-100 text-rose-800 border-rose-300', cardBorder: 'border-l-rose-500' };
    } else if (diffDias <= 3) {
      return { texto: 'Crítico', badge: 'bg-rose-100 text-rose-800 border-rose-300', cardBorder: 'border-l-rose-500' };
    } else if (diffDias <= 7) {
      return { texto: 'Atenção', badge: 'bg-amber-100 text-amber-800 border-amber-300', cardBorder: 'border-l-amber-500' };
    }
    return { texto: 'OK', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', cardBorder: 'border-l-emerald-500' };
  };

  // --- HANDLERS E SUBMITS ---
  const handleSalvarProcesso = (e: React.FormEvent) => {
    e.preventDefault();
    if (editProcessoId) {
      setProcessos(processos.map(p => p.id === editProcessoId ? {
        ...p, numero_cnj: numeroCnj, reclamante, reclamada, forum, vara, valor_causa: parseFloat(valorCausa) || 0
      } : p));
    } else {
      const novo = {
        id: Date.now().toString(),
        numero_cnj: numeroCnj,
        reclamante,
        reclamada,
        forum,
        vara,
        valor_causa: parseFloat(valorCausa) || 0
      };
      setProcessos([...processos, novo]);
    }
    limparFormProcesso();
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

  const excluirProcesso = (id: string) => {
    if (confirm('Deseja realmente excluir este processo e seus registros vinculados?')) {
      setProcessos(processos.filter(p => p.id !== id));
      setPrazos(prazos.filter(p => p.processo_id !== id));
      setAndamentos(andamentos.filter(a => a.processo_id !== id));
      setHonorarios(honorarios.filter(h => h.processo_id !== id));
    }
  };

  const handleSalvarPrazo = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPrazoId) {
      setPrazos(prazos.map(p => p.id === editPrazoId ? {
        ...p, processo_id: processoIdPrazo, titulo: tituloPrazo, data_vencimento: vencimentoPrazo
      } : p));
    } else {
      const novo = { id: Date.now().toString(), processo_id: processoIdPrazo, titulo: tituloPrazo, data_vencimento: vencimentoPrazo };
      setPrazos([...prazos, novo]);
    }
    limparFormPrazo();
  };

  const limparFormPrazo = () => {
    setEditPrazoId(null);
    setProcessoIdPrazo('');
    setTituloPrazo('');
    setVencimentoPrazo('');
  };

  const handleSalvarAndamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (editAndamentoId) {
      setAndamentos(andamentos.map(a => a.id === editAndamentoId ? {
        ...a, processo_id: processoIdAndamento, titulo: tituloAndamento, descricao: descricaoAndamento
      } : a));
    } else {
      const novo = { id: Date.now().toString(), processo_id: processoIdAndamento, titulo: tituloAndamento, descricao: descricaoAndamento };
      setAndamentos([...andamentos, novo]);
    }
    limparFormAndamento();
  };

  const limparFormAndamento = () => {
    setEditAndamentoId(null);
    setProcessoIdAndamento('');
    setTituloAndamento('');
    setDescricaoAndamento('');
  };

  const handleSalvarHonorario = (e: React.FormEvent) => {
    e.preventDefault();
    if (editHonorarioId) {
      setHonorarios(honorarios.map(h => h.id === editHonorarioId ? {
        ...h, processo_id: processoIdHonorario, tipo: tipoHonorario, valor: parseFloat(valorHonorario) || 0, data_vencimento: vencimentoHonorario, status_pagamento: statusPagamento
      } : h));
    } else {
      const novo = {
        id: Date.now().toString(),
        processo_id: processoIdHonorario,
        tipo: tipoHonorario,
        valor: parseFloat(valorHonorario) || 0,
        data_vencimento: vencimentoHonorario,
        status_pagamento: statusPagamento
      };
      setHonorarios([...honorarios, novo]);
    }
    limparFormHonorario();
  };

  const limparFormHonorario = () => {
    setEditHonorarioId(null);
    setProcessoIdHonorario('');
    setTipoHonorario('');
    setValorHonorario('');
    setVencimentoHonorario('');
    setStatusPagamento('Pendente');
  };

  const alternarStatusHonorario = (id: string, statusAtual: string) => {
    const novoStatus = statusAtual === 'Pago' ? 'Pendente' : 'Pago';
    setHonorarios(honorarios.map(h => h.id === id ? { ...h, status_pagamento: novoStatus } : h));
  };

  const handleTrocarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenhaInput !== confirmaSenhaInput) {
      alert('As senhas não coincidem!');
      return;
    }
    alert('Senha alterada com sucesso!');
    setNovaSenhaInput('');
    setConfirmaSenhaInput('');
    setModalSenhaAberto(false);
  };

  // --- FILTROS DE DADOS ---
  const processosFiltrados = processos.filter(p => 
    p.numero_cnj.toLowerCase().includes(busca.toLowerCase()) ||
    p.reclamante.toLowerCase().includes(busca.toLowerCase()) ||
    p.reclamada.toLowerCase().includes(busca.toLowerCase())
  );

  const prazosComProcesso = prazos.map(p => ({
    ...p,
    processos: processos.find(proc => proc.id === p.processo_id)
  }));

  const prazosFiltradosModal = prazosComProcesso.filter(p => {
    if (filtroUrgenciaPrazo === 'todos') return true;
    const urg = calcularUrgencia(p.data_vencimento);
    return urg.texto.toLowerCase() === filtroUrgenciaPrazo.toLowerCase();
  });

  const prazosDoProcesso = processoDetalhe ? prazos.filter(p => p.processo_id === processoDetalhe.id) : [];
  const andamentosDoProcesso = processoDetalhe ? andamentos.filter(a => a.processo_id === processoDetalhe.id) : [];
  const honorariosDoProcesso = processoDetalhe ? honorarios.filter(h => h.processo_id === processoDetalhe.id) : [];

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel de Gestão Pericial</h1>
            <p className="text-xs text-slate-500 mt-1">Gerenciamento de processos, prazos, andamentos e honorários</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModalTodosPrazosAberto(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition shadow-sm">
              Ver Todos os Prazos
            </button>
            <button onClick={() => setModalSenhaAberto(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-4 rounded-xl transition border border-slate-200">
              Segurança
            </button>
          </div>
        </header>

        {/* GRID DE FORMULÁRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* FORM 1: PROCESSO */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 border-slate-100">
                {editProcessoId ? 'Editar Processo' : 'Novo Processo'}
              </h2>
              <form onSubmit={handleSalvarProcesso} className="flex flex-col gap-2.5">
                <input type="text" placeholder="Número CNJ" value={numeroCnj} onChange={(e) => setNumeroCnj(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <input type="text" placeholder="Reclamante" value={reclamante} onChange={(e) => setReclamante(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <input type="text" placeholder="Reclamada" value={reclamada} onChange={(e) => setReclamada(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <input type="text" placeholder="Fórum" value={forum} onChange={(e) => setForum(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <input type="text" placeholder="Vara" value={vara} onChange={(e) => setVara(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <input type="number" step="0.01" placeholder="Valor da Causa (R$)" value={valorCausa} onChange={(e) => setValorCausa(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-2">
                  {editProcessoId ? 'Atualizar Processo' : 'Cadastrar Processo'}
                </button>
                {editProcessoId && (
                  <button type="button" onClick={limparFormProcesso} className="bg-slate-200 text-slate-700 text-xs py-1.5 rounded-lg">Cancelar</button>
                )}
              </form>
            </div>
          </section>

          {/* FORM 2: PRAZO */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 border-slate-100">
                {editPrazoId ? 'Editar Prazo' : 'Novo Prazo'}
              </h2>
              <form onSubmit={handleSalvarPrazo} className="flex flex-col gap-2.5">
                <select value={processoIdPrazo} onChange={(e) => setProcessoIdPrazo(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50">
                  <option value="">-- Selecione o Processo --</option>
                  {processos.map((proc) => (
                    <option key={proc.id} value={proc.id}>{proc.numero_cnj} - {proc.reclamante}</option>
                  ))}
                </select>
                <input type="text" placeholder="Título do Prazo" value={tituloPrazo} onChange={(e) => setTituloPrazo(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <input type="date" value={vencimentoPrazo} onChange={(e) => setVencimentoPrazo(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-2">
                  {editPrazoId ? 'Atualizar Prazo' : 'Lançar Prazo'}
                </button>
                {editPrazoId && (
                  <button type="button" onClick={limparFormPrazo} className="bg-slate-200 text-slate-700 text-xs py-1.5 rounded-lg">Cancelar</button>
                )}
              </form>
            </div>
          </section>

          {/* FORM 3: ANDAMENTO */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 border-slate-100">
                {editAndamentoId ? 'Editar Andamento' : 'Novo Andamento'}
              </h2>
              <form onSubmit={handleSalvarAndamento} className="flex flex-col gap-2.5">
                <select value={processoIdAndamento} onChange={(e) => setProcessoIdAndamento(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50">
                  <option value="">-- Selecione o Processo --</option>
                  {processos.map((proc) => (
                    <option key={proc.id} value={proc.id}>{proc.numero_cnj} - {proc.reclamante}</option>
                  ))}
                </select>
                <input type="text" placeholder="Título / Ocorrência" value={tituloAndamento} onChange={(e) => setTituloAndamento(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <textarea placeholder="Descrição breve..." value={descricaoAndamento} onChange={(e) => setDescricaoAndamento(e.target.value)} rows={3} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 resize-none" />
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-2">
                  {editAndamentoId ? 'Atualizar Andamento' : 'Lançar Andamento'}
                </button>
                {editAndamentoId && (
                  <button type="button" onClick={limparFormAndamento} className="bg-slate-200 text-slate-700 text-xs py-1.5 rounded-lg">Cancelar</button>
                )}
              </form>
            </div>
          </section>

          {/* FORM 4: HONORÁRIO */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 border-slate-100">
                {editHonorarioId ? 'Editar Honorário' : 'Novo Honorário'}
              </h2>
              <form onSubmit={handleSalvarHonorario} className="flex flex-col gap-2.5">
                <select value={processoIdHonorario} onChange={(e) => setProcessoIdHonorario(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50">
                  <option value="">-- Selecione o Processo --</option>
                  {processos.map((proc) => (
                    <option key={proc.id} value={proc.id}>{proc.numero_cnj} - {proc.reclamante}</option>
                  ))}
                </select>
                <input type="text" placeholder="Tipo (ex: Prévia, Pericial)" value={tipoHonorario} onChange={(e) => setTipoHonorario(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <input type="number" step="0.01" placeholder="Valor (R$)" value={valorHonorario} onChange={(e) => setValorHonorario(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <input type="date" value={vencimentoHonorario} onChange={(e) => setVencimentoHonorario(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
                <select value={statusPagamento} onChange={(e) => setStatusPagamento(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50">
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                </select>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-2">
                  {editHonorarioId ? 'Atualizar Honorário' : 'Lançar Honorário'}
                </button>
                {editHonorarioId && (
                  <button type="button" onClick={limparFormHonorario} className="bg-slate-200 text-slate-700 text-xs py-1.5 rounded-lg">Cancelar</button>
                )}
              </form>
            </div>
          </section>

        </div>

        {/* LISTA E BUSCA DE PROCESSOS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Processos Cadastrados</h2>
              <p className="text-xs text-slate-500">Listagem geral e busca avançada de processos</p>
            </div>
            <input
              type="text"
              placeholder="🔍 Buscar por CNJ, Reclamante ou Reclamada..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full sm:w-80 p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50">
                  <th className="py-3 px-4">CNJ</th>
                  <th className="py-3 px-4">Reclamante</th>
                  <th className="py-3 px-4">Reclamada</th>
                  <th className="py-3 px-4">Fórum / Vara</th>
                  <th className="py-3 px-4">Valor Causa</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {processosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">Nenhum processo encontrado.</td>
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
                          <button onClick={() => setProcessoDetalhe(proc)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded text-[11px] transition">Detalhes</button>
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

      {/* MODAL DETALHES DO PROCESSO */}
      {processoDetalhe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ficha do Processo</span>
                <h2 className="text-xl font-bold text-slate-900 font-mono">{processoDetalhe.numero_cnj}</h2>
              </div>
              <button onClick={() => setProcessoDetalhe(null)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-slate-50 rounded-xl text-xs">
              <div><span className="text-slate-400">Reclamante:</span> <p className="font-bold text-slate-800">{processoDetalhe.reclamante}</p></div>
              <div><span className="text-slate-400">Reclamada:</span> <p className="font-bold text-slate-800">{processoDetalhe.reclamada}</p></div>
              <div><span className="text-slate-400">Fórum:</span> <p className="font-semibold text-slate-700">{processoDetalhe.forum || 'N/A'}</p></div>
              <div><span className="text-slate-400">Vara:</span> <p className="font-semibold text-slate-700">{processoDetalhe.vara || 'N/A'}</p></div>
            </div>

            <div className="space-y-6 mt-6 text-xs">
              {/* Prazos */}
              <div>
                <h3 className="font-bold text-slate-900 border-b pb-1 mb-2">Prazos</h3>
                {prazosDoProcesso.length === 0 ? <p className="text-slate-400 italic">Nenhum prazo cadastrado.</p> : (
                  <ul className="space-y-1.5">
                    {prazosDoProcesso.map(p => (
                      <li key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                        <span>{p.titulo}</span>
                        <span className="font-mono font-semibold text-slate-700">{p.data_vencimento}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Andamentos */}
              <div>
                <h3 className="font-bold text-slate-900 border-b pb-1 mb-2">Andamentos</h3>
                {andamentosDoProcesso.length === 0 ? <p className="text-slate-400 italic">Nenhum andamento cadastrado.</p> : (
                  <ul className="space-y-2">
                    {andamentosDoProcesso.map(a => (
                      <li key={a.id} className="bg-slate-50 p-2.5 rounded">
                        <p className="font-bold text-slate-800">{a.titulo}</p>
                        <p className="text-slate-600 mt-0.5">{a.descricao}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Honorários */}
              <div>
                <h3 className="font-bold text-slate-900 border-b pb-1 mb-2">Honorários</h3>
                {honorariosDoProcesso.length === 0 ? <p className="text-slate-400 italic">Nenhum honorário cadastrado.</p> : (
                  <ul className="space-y-1.5">
                    {honorariosDoProcesso.map(h => (
                      <li key={h.id} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                        <span>{h.tipo} - R$ {h.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <button 
                          onClick={() => alternarStatusHonorario(h.id, h.status_pagamento)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.status_pagamento === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                        >
                          {h.status_pagamento}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPANDIR TODOS OS PRAZOS */}
      {modalTodosPrazosAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Todos os Prazos Cadastrados</h2>
              <button onClick={() => setModalTodosPrazosAberto(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <div className="flex gap-2 my-4">
              {['todos', 'critico', 'atencao', 'ok'].map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroUrgenciaPrazo(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${filtroUrgenciaPrazo === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {prazosFiltradosModal.map(p => {
                const urg = calcularUrgencia(p.data_vencimento);
                return (
                  <div key={p.id} className={`p-3 rounded-xl border flex justify-between items-center ${urg.cardBorder} border-l-4 bg-slate-50`}>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{p.titulo}</p>
                      <p className="text-[11px] text-slate-500">Proc: {p.processos?.numero_cnj} ({p.processos?.reclamante})</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${urg.badge}`}>{urg.texto}</span>
                      <p className="text-xs font-bold text-slate-700 mt-1">{p.data_vencimento}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR SENHA */}
      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Alterar Senha de Acesso</h2>
            <form onSubmit={handleTrocarSenha} className="space-y-3">
              <input type="password" placeholder="Nova Senha" value={novaSenhaInput} onChange={(e) => setNovaSenhaInput(e.target.value)} required className="w-full p-2.5 border rounded-lg text-xs" />
              <input type="password" placeholder="Confirmar Nova Senha" value={confirmaSenhaInput} onChange={(e) => setConfirmaSenhaInput(e.target.value)} required className="w-full p-2.5 border rounded-lg text-xs" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-lg text-xs">Salvar</button>
                <button type="button" onClick={() => setModalSenhaAberto(false)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg text-xs">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}