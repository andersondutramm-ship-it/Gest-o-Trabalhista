'use client';

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

interface Processo {
  id: string;
  numero_cnj: string;
  reclamante: string;
  reclamada: string;
  trt: string;
  forum: string;
  vara: string;
  valor_causa: number;
  status: string;
}

interface Prazo {
  id: string;
  processo_id: string;
  titulo: string;
  data_vencimento: string;
  status: string;
  processos?: Processo;
}

interface Andamento {
  id: string;
  processo_id: string;
  data_andamento: string;
  titulo: string;
  descricao: string;
  processos?: Processo;
}

interface Honorario {
  id: string;
  processo_id: string;
  tipo: string;
  valor: number;
  data_vencimento: string;
  status_pagamento: string;
  processos?: Processo;
}

export default function Home() {
  // Autenticação e Senha
  const [autenticado, setAutenticado] = useState(false);
  const [inputSenha, setInputSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('123456');
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [confirmaSenhaInput, setConfirmaSenhaInput] = useState('');

  // Dados
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [andamentos, setAndamentos] = useState<Andamento[]>([]);
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);

  // Filtros e Modais
  const [busca, setBusca] = useState('');
  const [processoDetalhe, setProcessoDetalhe] = useState<Processo | null>(null);
  const [modalTodosPrazosAberto, setModalTodosPrazosAberto] = useState(false);
  const [filtroUrgenciaPrazo, setFiltroUrgenciaPrazo] = useState<string>('todos');

  // Formulário Processo
  const [editProcessoId, setEditProcessoId] = useState<string | null>(null);
  const [cnj, setCnj] = useState('');
  const [reclamante, setReclamante] = useState('');
  const [reclamada, setReclamada] = useState('');
  const [forum, setForum] = useState('');
  const [vara, setVara] = useState('');
  const [valor, setValor] = useState('');

  // Formulário Prazo
  const [editPrazoId, setEditPrazoId] = useState<string | null>(null);
  const [processoIdPrazo, setProcessoIdPrazo] = useState('');
  const [tituloPrazo, setTituloPrazo] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  // Formulário Andamento
  const [editAndamentoId, setEditAndamentoId] = useState<string | null>(null);
  const [processoIdAndamento, setProcessoIdAndamento] = useState('');
  const [tituloAndamento, setTituloAndamento] = useState('');
  const [descricaoAndamento, setDescricaoAndamento] = useState('');

  // Formulário Honorário
  const [editHonorarioId, setEditHonorarioId] = useState<string | null>(null);
  const [processoIdHonorario, setProcessoIdHonorario] = useState('');
  const [tipoHonorario, setTipoHonorario] = useState('');
  const [valorHonorario, setValorHonorario] = useState('');
  const [vencimentoHonorario, setVencimentoHonorario] = useState('');
  const [statusPagamento, setStatusPagamento] = useState('Pendente');

  useEffect(() => {
    const authSalva = localStorage.getItem('app_autenticado');
    const senhaSalva = localStorage.getItem('app_senha_acesso');
    
    if (senhaSalva) {
      setSenhaAtual(senhaSalva);
    }
    if (authSalva === 'true') {
      setAutenticado(true);
    }
  }, []);

  useEffect(() => {
    if (autenticado) {
      carregarDados();
    }
  }, [autenticado]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (inputSenha === senhaAtual) {
      setAutenticado(true);
      localStorage.setItem('app_autenticado', 'true');
    } else {
      alert('Senha incorreta!');
    }
  }

  function handleLogout() {
    setAutenticado(false);
    localStorage.removeItem('app_autenticado');
  }

  function handleTrocarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenhaInput.length < 4) {
      alert('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (novaSenhaInput !== confirmaSenhaInput) {
      alert('As senhas não coincidem!');
      return;
    }
    setSenhaAtual(novaSenhaInput);
    localStorage.setItem('app_senha_acesso', novaSenhaInput);
    alert('Senha alterada com sucesso!');
    setNovaSenhaInput('');
    setConfirmaSenhaInput('');
    setModalSenhaAberto(false);
  }

  async function carregarDados() {
    const { data: procData } = await supabase.from('processos').select('*').order('created_at', { ascending: false });
    const { data: prazosData } = await supabase.from('prazos').select('*, processos(numero_cnj, reclamante)').order('data_vencimento', { ascending: true });
    const { data: andamentosData } = await supabase.from('andamentos').select('*, processos(numero_cnj, reclamante)').order('data_andamento', { ascending: false });
    const { data: honorariosData } = await supabase.from('honorarios').select('*, processos(numero_cnj, reclamante)').order('data_vencimento', { ascending: true });

    if (procData) setProcessos(procData);
    if (prazosData) setPrazos(prazosData);
    if (andamentosData) setAndamentos(andamentosData);
    if (honorariosData) setHonorarios(honorariosData);
  }

  // AÇÕES PROCESSO
  async function salvarProcesso(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      numero_cnj: cnj,
      reclamante,
      reclamada,
      forum,
      vara,
      valor_causa: parseFloat(valor) || 0,
    };

    let error;
    if (editProcessoId) {
      const res = await supabase.from('processos').update(payload).eq('id', editProcessoId);
      error = res.error;
    } else {
      const res = await supabase.from('processos').insert([payload]);
      error = res.error;
    }

    if (!error) {
      limparFormProcesso();
      carregarDados();
    } else {
      alert('Erro ao salvar processo: ' + error.message);
    }
  }

  function prepararEdicaoProcesso(proc: Processo) {
    setEditProcessoId(proc.id);
    setCnj(proc.numero_cnj);
    setReclamante(proc.reclamante);
    setReclamada(proc.reclamada);
    setForum(proc.forum || '');
    setVara(proc.vara || '');
    setValor(proc.valor_causa?.toString() || '');
  }

  function limparFormProcesso() {
    setEditProcessoId(null);
    setCnj('');
    setReclamante('');
    setReclamada('');
    setForum('');
    setVara('');
    setValor('');
  }

  async function excluirProcesso(id: string) {
    if (!confirm('Deseja realmente excluir este processo? Registros vinculados também serão alterados.')) return;
    const { error } = await supabase.from('processos').delete().eq('id', id);
    if (!error) {
      if (processoDetalhe?.id === id) setProcessoDetalhe(null);
      carregarDados();
    } else {
      alert('Erro ao excluir processo: ' + error.message);
    }
  }

  // AÇÕES PRAZO
  async function salvarPrazo(e: React.FormEvent) {
    e.preventDefault();
    if (!processoIdPrazo) return alert('Selecione um processo!');

    const payload = {
      processo_id: processoIdPrazo,
      titulo: tituloPrazo,
      data_vencimento: dataVencimento,
    };

    let error;
    if (editPrazoId) {
      const res = await supabase.from('prazos').update(payload).eq('id', editPrazoId);
      error = res.error;
    } else {
      const res = await supabase.from('prazos').insert([payload]);
      error = res.error;
    }

    if (!error) {
      limparFormPrazo();
      carregarDados();
    } else {
      alert('Erro ao salvar prazo: ' + error.message);
    }
  }

  function prepararEdicaoPrazo(p: Prazo) {
    setEditPrazoId(p.id);
    setProcessoIdPrazo(p.processo_id);
    setTituloPrazo(p.titulo);
    setDataVencimento(p.data_vencimento);
  }

  function limparFormPrazo() {
    setEditPrazoId(null);
    setProcessoIdPrazo('');
    setTituloPrazo('');
    setDataVencimento('');
  }

  async function excluirPrazo(id: string) {
    if (!confirm('Deseja excluir este prazo?')) return;
    const { error } = await supabase.from('prazos').delete().eq('id', id);
    if (!error) carregarDados();
    else alert('Erro ao excluir prazo: ' + error.message);
  }

  // AÇÕES ANDAMENTO
  async function salvarAndamento(e: React.FormEvent) {
    e.preventDefault();
    if (!processoIdAndamento) return alert('Selecione um processo!');

    const payload = {
      processo_id: processoIdAndamento,
      titulo: tituloAndamento,
      descricao: descricaoAndamento,
    };

    let error;
    if (editAndamentoId) {
      const res = await supabase.from('andamentos').update(payload).eq('id', editAndamentoId);
      error = res.error;
    } else {
      const res = await supabase.from('andamentos').insert([payload]);
      error = res.error;
    }

    if (!error) {
      limparFormAndamento();
      carregarDados();
    } else {
      alert('Erro ao salvar andamento: ' + error.message);
    }
  }

  function prepararEdicaoAndamento(a: Andamento) {
    setEditAndamentoId(a.id);
    setProcessoIdAndamento(a.processo_id);
    setTituloAndamento(a.titulo);
    setDescricaoAndamento(a.descricao || '');
  }

  function limparFormAndamento() {
    setEditAndamentoId(null);
    setProcessoIdAndamento('');
    setTituloAndamento('');
    setDescricaoAndamento('');
  }

  async function excluirAndamento(id: string) {
    if (!confirm('Deseja excluir este andamento do histórico?')) return;
    const { error } = await supabase.from('andamentos').delete().eq('id', id);
    if (!error) carregarDados();
    else alert('Erro ao excluir andamento: ' + error.message);
  }

  // AÇÕES HONORÁRIO
  async function salvarHonorario(e: React.FormEvent) {
    e.preventDefault();
    if (!processoIdHonorario) return alert('Selecione um processo!');

    const payload = {
      processo_id: processoIdHonorario,
      tipo: tipoHonorario,
      valor: parseFloat(valorHonorario) || 0,
      data_vencimento: vencimentoHonorario,
      status_pagamento: statusPagamento,
    };

    let error;
    if (editHonorarioId) {
      const res = await supabase.from('honorarios').update(payload).eq('id', editHonorarioId);
      error = res.error;
    } else {
      const res = await supabase.from('honorarios').insert([payload]);
      error = res.error;
    }

    if (!error) {
      limparFormHonorario();
      carregarDados();
    } else {
      alert('Erro ao salvar honorário: ' + error.message);
    }
  }

  function prepararEdicaoHonorario(h: Honorario) {
    setEditHonorarioId(h.id);
    setProcessoIdHonorario(h.processo_id);
    setTipoHonorario(h.tipo);
    setValorHonorario(h.valor.toString());
    setVencimentoHonorario(h.data_vencimento);
    setStatusPagamento(h.status_pagamento);
  }

  function limparFormHonorario() {
    setEditHonorarioId(null);
    setProcessoIdHonorario('');
    setTipoHonorario('');
    setValorHonorario('');
    setVencimentoHonorario('');
    setStatusPagamento('Pendente');
  }

  async function excluirHonorario(id: string) {
    if (!confirm('Deseja excluir este honorário?')) return;
    const { error } = await supabase.from('honorarios').delete().eq('id', id);
    if (!error) carregarDados();
    else alert('Erro ao excluir honorário: ' + error.message);
  }

  async function alternarStatusHonorario(id: string, statusAtual: string) {
    const novoStatus = statusAtual === 'Pago' ? 'Pendente' : 'Pago';
    const { error } = await supabase.from('honorarios').update({ status_pagamento: novoStatus }).eq('id', id);
    if (!error) carregarDados();
  }

  // Cálculo de Urgência de Prazo
  function calcularUrgencia(dataVencimentoStr: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const partesData = dataVencimentoStr.split('-');
    const venc = new Date(Number(partesData[0]), Number(partesData[1]) - 1, Number(partesData[2]));
    venc.setHours(0, 0, 0, 0);

    const diffDias = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffDias < 0) return { texto: 'Vencido', badge: 'bg-rose-100 text-rose-800 border-rose-200', cardBorder: 'border-l-rose-600', nivel: 'critico' };
    if (diffDias <= 2) return { texto: 'Urgente (≤ 2 dias)', badge: 'bg-red-500 text-white', cardBorder: 'border-l-red-600', nivel: 'critico' };
    if (diffDias <= 5) return { texto: 'Atenção (≤ 5 dias)', badge: 'bg-amber-100 text-amber-900 border-amber-300', cardBorder: 'border-l-amber-500', nivel: 'atencao' };
    return { texto: 'No Prazo', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', cardBorder: 'border-l-emerald-500', nivel: 'ok' };
  }

  // EXPORTAÇÃO CSV
  function exportarProcessosCSV() {
    if (processos.length === 0) return alert('Nenhum processo para exportar.');
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFFCNJ;Reclamante;Reclamada;Forum;Vara;Valor Causa (R$)\n';
    processos.forEach((p) => {
      csvContent += `"${p.numero_cnj}";"${p.reclamante}";"${p.reclamada}";"${p.forum || ''}";"${p.vara || ''}";"${p.valor_causa || 0}"\n`;
    });
    fazerDownloadCSV(csvContent, `processos_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportarHonorariosCSV() {
    if (honorarios.length === 0) return alert('Nenhum honorário para exportar.');
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFFCNJ;Reclamante;Tipo;Valor (R$);Vencimento;Status\n';
    honorarios.forEach((h) => {
      csvContent += `"${h.processos?.numero_cnj || ''}";"${h.processos?.reclamante || ''}";"${h.tipo}";"${h.valor}";"${h.data_vencimento}";"${h.status_pagamento}"\n`;
    });
    fazerDownloadCSV(csvContent, `honorarios_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportarPrazosCSV() {
    if (prazos.length === 0) return alert('Nenhum prazo para exportar.');
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFFTitulo Prazo;CNJ;Reclamante;Vencimento;Status Urgencia\n';
    prazos.forEach((p) => {
      const urg = calcularUrgencia(p.data_vencimento);
      csvContent += `"${p.titulo}";"${p.processos?.numero_cnj || ''}";"${p.processos?.reclamante || ''}";"${p.data_vencimento}";"${urg.texto}"\n`;
    });
    fazerDownloadCSV(csvContent, `relatorio_prazos_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function fazerDownloadCSV(content: string, filename: string) {
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filtragem
  const processosFiltrados = processos.filter((p) => {
    const termo = busca.toLowerCase();
    return (
      p.numero_cnj.toLowerCase().includes(termo) ||
      p.reclamante.toLowerCase().includes(termo) ||
      p.reclamada.toLowerCase().includes(termo)
    );
  });

  const prazosOrdenados = [...prazos].sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));

  const prazosFiltradosModal = prazosOrdenados.filter(p => {
    if (filtroUrgenciaPrazo === 'todos') return true;
    const urg = calcularUrgencia(p.data_vencimento);
    if (filtroUrgenciaPrazo === 'critico') return urg.nivel === 'critico';
    if (filtroUrgenciaPrazo === 'atencao') return urg.nivel === 'atencao';
    if (filtroUrgenciaPrazo === 'ok') return urg.nivel === 'ok';
    return true;
  });

  const totalHonorarios = honorarios.reduce((acc, h) => acc + (Number(h.valor) || 0), 0);
  const totalPago = honorarios.filter(h => h.status_pagamento === 'Pago').reduce((acc, h) => acc + (Number(h.valor) || 0), 0);
  const totalPendente = honorarios.filter(h => h.status_pagamento !== 'Pago').reduce((acc, h) => acc + (Number(h.valor) || 0), 0);
  const prazosCriticosCount = prazos.filter(p => calcularUrgencia(p.data_vencimento).nivel === 'critico').length;

  // Tela de Login
  if (!autenticado) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-3 text-slate-800 text-2xl font-bold">
              ⚖️
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Portal de Perícia Trabalhista</h1>
            <p className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">Acesso Restrito ao Sistema</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Senha de Acesso</label>
              <input
                type="password"
                placeholder="••••••••"
                value={inputSenha}
                onChange={(e) => setInputSenha(e.target.value)}
                required
                className="w-full p-3.5 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 transition"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-slate-900/20 active:scale-[0.98]"
            >
              Acessar Painel
            </button>
          </form>
        </div>
      </main>
    );
  }

  const prazosDoProcesso = prazos.filter(p => p.processo_id === processoDetalhe?.id);
  const andamentosDoProcesso = andamentos.filter(a => a.processo_id === processoDetalhe?.id);
  const honorariosDoProcesso = honorarios.filter(h => h.processo_id === processoDetalhe?.id);

  return (
    <main className="min-h-screen bg-slate-100/70 text-slate-800">
      
      {/* BARRA SUPERIOR DE NAVEGAÇÃO E OPÇÕES */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">Perícia & Consultoria Trabalhista</h1>
              <p className="text-xs text-slate-400">Sistema Integrado de Gestão Processual e Financeira</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModalSenhaAberto(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs py-2 px-3 rounded-lg transition flex items-center gap-1.5"
            >
              🔑 Alterar Senha
            </button>
            <button
              onClick={exportarPrazosCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs py-2 px-3 rounded-lg transition"
            >
              📅 Exportar Prazos
            </button>
            <button
              onClick={exportarProcessosCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs py-2 px-3 rounded-lg transition"
            >
              📊 Exportar Processos
            </button>
            <button
              onClick={exportarHonorariosCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs py-2 px-3 rounded-lg transition"
            >
              💵 Exportar Honorários
            </button>
            <button
              onClick={handleLogout}
              className="bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs py-2 px-3 rounded-lg transition ml-2"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* RELATÓRIO GERENCIAL DE MÉTRICAS */}
        <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Processos Ativos</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900">{processos.length}</span>
              <span className="text-xs text-slate-500 font-medium">cadastrados</span>
            </div>
          </div>

          <div 
            onClick={() => setModalTodosPrazosAberto(true)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-l-4 border-l-red-500 cursor-pointer hover:shadow-md transition group"
          >
            <div className="flex justify-between items-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prazos e Alertas</p>
              <span className="text-xs text-slate-400 group-hover:text-slate-800 transition font-semibold">Ver todos →</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-red-600">{prazosCriticosCount}</span>
              <span className="text-xs text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded">Críticos / Vencidos</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-l-4 border-l-emerald-500">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Honorários Recebidos</p>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-emerald-600">R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <p className="text-xs text-slate-500 mt-0.5">de R$ {totalHonorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} previstos</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-l-4 border-l-amber-500">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Honorários a Receber</p>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-amber-600">R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <p className="text-xs text-slate-500 mt-0.5">pendentes de pagamento</p>
            </div>
          </div>
        </section>

        {/* PAINEL DE PRAZOS PRÓXIMOS DE VENCER */}
        <section className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Agenda Próxima de Prazos</h2>
              <p className="text-xs text-slate-500">Acompanhamento contínuo dos vencimentos em ordem cronológica</p>
            </div>
            <button
              onClick={() => setModalTodosPrazosAberto(true)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3.5 rounded-lg transition"
            >
              🔍 Expandir Todos ({prazos.length})
            </button>
          </div>

          {prazosOrdenados.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhum prazo pendente cadastrado.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prazosOrdenados.slice(0, 6).map((prazo) => {
                const alerta = calcularUrgencia(prazo.data_vencimento);
                return (
                  <div key={prazo.id} className={`p-4 rounded-xl border bg-slate-50/50 flex flex-col justify-between ${alerta.cardBorder} border-l-4 shadow-xs`}>
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{prazo.titulo}</h3>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border whitespace-nowrap ${alerta.badge}`}>
                          {alerta.texto}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Proc: <span className="font-mono text-slate-800">{prazo.processos?.numero_cnj || 'N/A'}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Reclamante: {prazo.processos?.reclamante}
                      </p>
                      <p className="text-xs font-bold text-slate-800 mt-3 flex items-center gap-1">
                        📅 Vencimento: {prazo.data_vencimento}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-end gap-3 text-xs">
                      <button onClick={() => prepararEdicaoPrazo(prazo)} className="font-semibold text-slate-700 hover:text-slate-900">Editar</button>
                      <button onClick={() => excluirPrazo(prazo.id)} className="font-semibold text-rose-600 hover:text-rose-800">Excluir</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CADASTRO E EDIÇÃO DE REGISTROS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Form Processo */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              {editProcessoId ? '✏️ Editar Processo' : '➕ Novo Processo'}
            </h2>
            <form onSubmit={salvarProcesso} className="flex flex-col gap-2.5">
              <input type="text" placeholder="Número CNJ" value={cnj} onChange={(e) => setCnj(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none" />
              <input type="text" placeholder="Reclamante" value={reclamante} onChange={(e) => setReclamante(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none" />
              <input type="text" placeholder="Reclamada" value={reclamada} onChange={(e) => setReclamada(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none" />
              <input type="text" placeholder="Fórum" value={forum} onChange={(e) => setForum(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none" />
              <input type="text" placeholder="Vara Trabalhista" value={vara} onChange={(e) => setVara(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none" />
              <input type="number" step="0.01" placeholder="Valor Causa (R$)" value={valor} onChange={(e) => setValor(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none" />
              
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-2">
                {editProcessoId ? 'Atualizar Processo' : 'Salvar Processo'}
              </button>
              {editProcessoId && (
                <button type="button" onClick={limparFormProcesso} className="bg-slate-200 text-slate-700 text-xs py-1.5 rounded-lg">Cancelar</button>
              )}
            </form>
          </section>

          {/* Form Prazo */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              {editPrazoId ? '✏️ Editar Prazo' : '➕ Novo Prazo'}
            </h2>
            <form onSubmit={salvarPrazo} className="flex flex-col gap-2.5">
              <select value={processoIdPrazo} onChange={(e) => setProcessoIdPrazo(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50">
                <option value="">-- Selecione o Processo --</option>
                {processos.map((proc) => (
                  <option key={proc.id} value={proc.id}>{proc.numero_cnj} - {proc.reclamante}</option>
                ))}
              </select>
              <input type="text" placeholder="Descrição do Prazo" value={tituloPrazo} onChange={(e) => setTituloPrazo(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
              <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition mt-auto">
                {editPrazoId ? 'Atualizar Prazo' : 'Vincular Prazo'}
              </button>
              {editPrazoId && (
                <button type="button" onClick={limparFormPrazo} className="bg-slate-200 text-slate-700 text-xs py-1.5 rounded-lg">Cancelar</button>
              )}
            </form>
          </section>

          {/* Form Andamento */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              {editAndamentoId ? '✏️ Editar Andamento' : '➕ Novo Andamento'}
            </h2>
            <form onSubmit={salvarAndamento} className="flex flex-col gap-2.5">
              <select value={processoIdAndamento} onChange={(e) => setProcessoIdAndamento(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50">
                <option value="">-- Selecione o Processo --</option>
                {processos.map((proc) => (
                  <option key={proc.id} value={proc.id}>{proc.numero_cnj} - {proc.reclamante}</option>
                ))}
              </select>
              <input type="text" placeholder="Título (ex: Vistoria)" value={tituloAndamento} onChange={(e) => setTituloAndamento(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
              <textarea placeholder="Detalhes..." value={descricaoAndamento} onChange={(e) => setDescricaoAndamento(e.target.value)} rows={3} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 resize-none" />
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition">
                {editAndamentoId ? 'Atualizar Andamento' : 'Registrar Andamento'}
              </button>
              {editAndamentoId && (
                <button type="button" onClick={limparFormAndamento} className="bg-slate-200 text-slate-700 text-xs py-1.5 rounded-lg">Cancelar</button>
              )}
            </form>
          </section>

          {/* Form Honorários */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              {editHonorarioId ? '✏️ Editar Honorário' : '➕ Lançar Honorário'}
            </h2>
            <form onSubmit={salvarHonorario} className="flex flex-col gap-2.5">
              <select value={processoIdHonorario} onChange={(e) => setProcessoIdHonorario(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50">
                <option value="">-- Selecione o Processo --</option>
                {processos.map((proc) => (
                  <option key={proc.id} value={proc.id}>{proc.numero_cnj} - {proc.reclamante}</option>
                ))}
              </select>
              <input type="text" placeholder="Tipo (ex: Pericial)" value={tipoHonorario} onChange={(e) => setTipoHonorario(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
              <input type="number" step="0.01" placeholder="Valor (R$)" value={valorHonorario} onChange={(e) => setValorHonorario(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
              <input type="date" value={vencimentoHonorario} onChange={(e) => setVencimentoHonorario(e.target.value)} required className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50" />
              <select value={statusPagamento} onChange={(e) => setStatusPagamento(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50">
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
              </select>
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition">
                {editHonorarioId ? 'Atualizar Honorário' : 'Salvar Honorário'}
              </button>
              {editHonorarioId && (
                <button type="button" onClick={limparFormHonorario} className="bg-slate-200 text-slate-700 text-xs py-1.5 rounded-lg">Cancelar</button>
              )}
            </form>
          </section>

        </div>

        {/* TABELA DE PROCESSOS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Processos Cadastrados</h2>
              <p className="text-xs text-slate-500">Lista completa com atalhos de ações e fichas completas</p>
            </div>
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="🔍 Buscar por CNJ, Reclamante ou Reclamada..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-3.5 rounded-l-lg">CNJ</th>
                  <th className="p-3.5">Reclamante</th>
                  <th className="p-3.5">Reclamada</th>
                  <th className="p-3.5">Fórum / Vara</th>
                  <th className="p-3.5">Valor Causa</th>
                  <th className="p-3.5 text-center rounded-r-lg">Ações</th>
                </tr>
              </thead>
              <tbody>
                {processosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                      Nenhum processo encontrado.
                    </td>
                  </tr>
                ) : (
                  processosFiltrados.map((proc) => (
                    <tr key={proc.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition text-xs">
                      <td className="p-3.5 font-mono font-bold text-slate-800">{proc.numero_cnj}</td>
                      <td className="p-3.5 font-medium text-slate-800">{proc.reclamante}</td>
                      <td className="p-3.5 text-slate-600">{proc.reclamada}</td>
                      <td className="p-3.5 text-slate-600">{proc.forum} - {proc.vara}</td>
                      <td className="p-3.5 font-bold text-slate-900">R$ {proc.valor_causa?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => setProcessoDetalhe(proc)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] py-1 px-2.5 rounded-md font-semibold"
                          >
                            Ficha
                          </button>
                          <button
                            onClick={() => prepararEdicaoProcesso(proc)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] py-1 px-2.5 rounded-md font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => excluirProcesso(proc.id)}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] py-1 px-2.5 rounded-md font-semibold"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* TABELA DE HONORÁRIOS */}
        <section className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Gestão de Honorários</h2>
          <p className="text-xs text-slate-500 mb-5">Controle financeiro e status de adimplemento</p>

          {honorarios.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhum honorário lançado até o momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3.5 rounded-l-lg">Processo (CNJ)</th>
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5">Vencimento</th>
                    <th className="p-3.5">Valor</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center rounded-r-lg">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {honorarios.map((h) => (
                    <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50/80 text-xs">
                      <td className="p-3.5 font-mono font-medium text-slate-800">
                        {h.processos?.numero_cnj} <span className="text-slate-400 font-sans">({h.processos?.reclamante})</span>
                      </td>
                      <td className="p-3.5 text-slate-700">{h.tipo}</td>
                      <td className="p-3.5 text-slate-700">{h.data_vencimento}</td>
                      <td className="p-3.5 font-bold text-slate-900">R$ {Number(h.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${h.status_pagamento === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                          {h.status_pagamento}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => alternarStatusHonorario(h.id, h.status_pagamento)}
                            className={`text-[11px] px-2.5 py-1 rounded-md font-semibold text-white ${h.status_pagamento === 'Pago' ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                          >
                            {h.status_pagamento === 'Pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                          </button>
                          <button
                            onClick={() => prepararEdicaoHonorario(h)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] py-1 px-2.5 rounded-md font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => excluirHonorario(h.id)}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] py-1 px-2.5 rounded-md font-semibold"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* HISTÓRICO DE ANDAMENTOS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Linha do Tempo de Andamentos</h2>
          <p className="text-xs text-slate-500 mb-5">Registro de atividades e vistorias executadas</p>

          {andamentos.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhum andamento registrado até o momento.</p>
          ) : (
            <div className="space-y-3">
              {andamentos.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-sm">{item.titulo}</h3>
                      <span className="text-[11px] text-slate-400">
                        • {new Date(item.data_andamento).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono mb-1">
                      Proc: {item.processos?.numero_cnj} ({item.processos?.reclamante})
                    </p>
                    {item.descricao && <p className="text-xs text-slate-600 mt-2">{item.descricao}</p>}
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button onClick={() => prepararEdicaoAndamento(item)} className="text-slate-600 hover:underline font-semibold">Editar</button>
                    <button onClick={() => excluirAndamento(item.id)} className="text-rose-600 hover:underline font-semibold">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* MODAL: TODOS OS PRAZOS EM ORDEM CRONOLÓGICA */}
      {modalTodosPrazosAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative flex flex-col">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Relatório Geral de Prazos</h2>
                <p className="text-xs text-slate-500">Listagem completa em ordem cronológica de vencimento</p>
              </div>
              <button
                onClick={() => setModalTodosPrazosAberto(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Filtros de Urgência no Modal */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFiltroUrgenciaPrazo('todos')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${filtroUrgenciaPrazo === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Todos ({prazos.length})
              </button>
              <button
                onClick={() => setFiltroUrgenciaPrazo('critico')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${filtroUrgenciaPrazo === 'critico' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200'}`}
              >
                Urgentes/Vencidos ({prazos.filter(p => calcularUrgencia(p.data_vencimento).nivel === 'critico').length})
              </button>
              <button
                onClick={() => setFiltroUrgenciaPrazo('atencao')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${filtroUrgenciaPrazo === 'atencao' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}
              >
                Atenção (≤ 5 dias) ({prazos.filter(p => calcularUrgencia(p.data_vencimento).nivel === 'atencao').length})
              </button>
              <button
                onClick={() => setFiltroUrgenciaPrazo('ok')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${filtroUrgenciaPrazo === 'ok' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}
              >
                No Prazo ({prazos.filter(p => calcularUrgencia(p.data_vencimento).nivel === 'ok').length})
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              {prazosFiltradosModal.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">Nenhum prazo encontrado nesta categoria.</p>
              ) : (
                prazosFiltradosModal.map((prazo) => {
                  const urg = calcularUrgencia(prazo.data_vencimento);
                  return (
                    <div key={prazo.id} className={`p-4 rounded-xl border bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 ${urg.cardBorder} border-l-4`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{prazo.titulo}</h3>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${urg.badge}`}>
                            {urg.texto}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          CNJ: <span className="font-mono text-slate-800">{prazo.processos?.numero_cnj || 'N/A'}</span> — Reclamante: {prazo.processos?.reclamante}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200">
                        <span className="text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                          📅 {prazo.data_vencimento}
                        </span>
                        <div className="flex gap-2 text-xs">
                          <button onClick={() => { setModalTodosPrazosAberto(false); prepararEdicaoPrazo(prazo); }} className="text-slate-700 hover:underline font-semibold">Editar</button>
                          <button onClick={() => excluirPrazo(prazo.id)} className="text-rose-600 hover:underline font-semibold">Excluir</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={exportarPrazosCSV}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-xl text-xs transition"
              >
                📥 Baixar esta lista em CSV
              </button>
              <button
                onClick={() => setModalTodosPrazosAberto(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-5 rounded-xl text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR SENHA */}
      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-lg font-bold text-slate-900 mb-1">🔑 Alterar Senha de Acesso</h2>
            <p className="text-xs text-slate-500 mb-4">Defina uma nova senha para proteger a aplicação</p>

            <form onSubmit={handleTrocarSenha} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={novaSenhaInput}
                  onChange={(e) => setNovaSenhaInput(e.target.value)}
                  required
                  placeholder="Digite a nova senha..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmaSenhaInput}
                  onChange={(e) => setConfirmaSenhaInput(e.target.value)}
                  required
                  placeholder="Repita a nova senha..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalSenhaAberto(false)}
                  className="bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-lg"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA DO PROCESSO */}
      {processoDetalhe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  Ficha do Processo
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1 font-mono">{processoDetalhe.numero_cnj}</h2>
              </div>
              <button
                onClick={() => setProcessoDetalhe(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl mb-6 text-xs border border-slate-200/60">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Reclamante</p>
                <p className="font-bold text-slate-800 mt-0.5">{processoDetalhe.reclamante}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Reclamada</p>
                <p className="font-bold text-slate-800 mt-0.5">{processoDetalhe.reclamada}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Fórum / Vara</p>
                <p className="font-bold text-slate-800 mt-0.5">{processoDetalhe.forum} - {processoDetalhe.vara}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Valor Causa</p>
                <p className="font-bold text-slate-800 mt-0.5">R$ {processoDetalhe.valor_causa?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Prazos */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prazos Deste Processo</h3>
                {prazosDoProcesso.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum prazo cadastrado.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {prazosDoProcesso.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800">{p.titulo}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Vencimento: {p.data_vencimento}</p>
                        </div>
                        <button onClick={() => excluirPrazo(p.id)} className="text-xs text-rose-600 hover:underline font-semibold">Excluir</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Honorários */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Honorários Vinculados</h3>
                {honorariosDoProcesso.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum honorário lançado.</p>
                ) : (
                  <div className="space-y-2">
                    {honorariosDoProcesso.map((h) => (
                      <div key={h.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs border border-slate-200">
                        <div>
                          <p className="font-semibold text-slate-800">{h.tipo}</p>
                          <p className="text-[11px] text-slate-500">Vencimento: {h.data_vencimento}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">R$ {Number(h.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${h.status_pagamento === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                            {h.status_pagamento}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Andamentos */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Andamentos e Atividades</h3>
                {andamentosDoProcesso.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum andamento registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {andamentosDoProcesso.map((a) => (
                      <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span className="font-bold text-slate-800">{a.titulo}</span>
                          <span>{new Date(a.data_andamento).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {a.descricao && <p className="text-slate-600 mt-1">{a.descricao}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setProcessoDetalhe(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-5 rounded-xl text-xs transition"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
function diasSemMovimentacao(dataUltimaMovimentacao: string): number {
  const dataUltima = new Date(dataUltimaMovimentacao);
  const hoje = new Date();
  const diferencaEmMs = hoje.getTime() - dataUltima.getTime();
  return Math.floor(diferencaEmMs / (1000 * 60 * 60 * 24));
}
