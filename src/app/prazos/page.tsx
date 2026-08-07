'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Processo {
  id: string;
  numero: string;
  reclamante?: string;
}

interface Prazo {
  id: string;
  processo_id: string;
  descricao: string;
  data_vencimento: string;
  status: string;
  processos?: {
    numero: string;
    reclamante: string;
  };
}

export default function PrazosPage() {
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Prazo
  const [modalPrazoAberto, setModalPrazoAberto] = useState(false);

  // Edição
  const [prazoEditando, setPrazoEditando] = useState<Prazo | null>(null);

  // Formulário do Prazo
  const [processoId, setProcessoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [status, setStatus] = useState('Pendente');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);

    const { data: dadosProcessos } = await supabase
      .from('processos')
      .select('id, numero, reclamante')
      .order('numero', { ascending: true });

    if (dadosProcessos && dadosProcessos.length > 0) {
      setProcessos(dadosProcessos);
      if (!processoId) setProcessoId(dadosProcessos[0].id);
    }

    const { data: dadosPrazos } = await supabase
      .from('prazos')
      .select('*, processos(numero, reclamante)')
      .order('data_vencimento', { ascending: true });

    if (dadosPrazos) {
      setPrazos(dadosPrazos);
    }

    setLoading(false);
  }

  function abrirModalNovoPrazo() {
    setPrazoEditando(null);
    setDescricao('');
    setDataVencimento('');
    setStatus('Pendente');
    if (processos.length > 0) setProcessoId(processos[0].id);
    setModalPrazoAberto(true);
  }

  function abrirModalEditarPrazo(prazo: Prazo) {
    setPrazoEditando(prazo);
    setProcessoId(prazo.processo_id);
    setDescricao(prazo.descricao || '');
    setDataVencimento(prazo.data_vencimento ? prazo.data_vencimento.substring(0, 10) : '');
    setStatus(prazo.status || 'Pendente');
    setModalPrazoAberto(true);
  }

  async function handleSalvarPrazo(e: React.FormEvent) {
    e.preventDefault();

    if (!processoId) {
      alert('Selecione um processo cadastrado.');
      return;
    }

    if (prazoEditando) {
      const { error } = await supabase
        .from('prazos')
        .update({
          processo_id: processoId,
          descricao,
          data_vencimento: dataVencimento,
          status,
        })
        .eq('id', prazoEditando.id);

      if (error) alert('Erro ao atualizar: ' + error.message);
    } else {
      const { error } = await supabase.from('prazos').insert([
        {
          processo_id: processoId,
          descricao,
          data_vencimento: dataVencimento,
          status,
        },
      ]);

      if (error) alert('Erro ao cadastrar: ' + error.message);
    }

    setModalPrazoAberto(false);
    carregarDados();
  }

  async function handleExcluirPrazo(id: string) {
    if (!confirm('Tem certeza que deseja excluir este prazo?')) return;

    const { error } = await supabase.from('prazos').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      carregarDados();
    }
  }

  function exportarCSV() {
    if (prazos.length === 0) {
      alert('Não há prazos para exportar.');
      return;
    }

    const cabecalho = 'Processo,Reclamante,Descricao,Vencimento,Status\n';
    const linhas = prazos
      .map((p) => {
        const num = p.processos?.numero || '';
        const rec = p.processos?.reclamante || '';
        const desc = p.descricao || '';
        const venc = p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString('pt-BR') : '';
        const st = p.status || '';
        return `"${num}","${rec}","${desc}","${venc}","${st}"`;
      })
      .join('\n');

    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prazos_gestao_trabalhista.csv';
    a.click();
  }

  function formatarData(dataIso: string) {
    if (!dataIso) return '-';
    const partes = dataIso.substring(0, 10).split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataIso;
  }

  function obterAlertaData(dataIso: string, statusPrazo: string) {
    if (!dataIso || statusPrazo === 'Concluído') return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const partes = dataIso.substring(0, 10).split('-');
    const dataVencimento = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    dataVencimento.setHours(0, 0, 0, 0);

    const diferencaDias = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diferencaDias < 0) {
      return (
        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
          VENCIDO ({Math.abs(diferencaDias)}d)
        </span>
      );
    } else if (diferencaDias === 0) {
      return (
        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">
          VENCE HOJE
        </span>
      );
    } else if (diferencaDias <= 3) {
      return (
        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          URGENTE ({diferencaDias}d)
        </span>
      );
    } else if (diferencaDias <= 7) {
      return (
        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
          PRÓXIMO ({diferencaDias}d)
        </span>
      );
    }

    return null;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Topo com navegação e ações */}
      <div className="bg-white p-4 rounded-xl shadow border border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Prazos</h1>
          <p className="text-xs text-slate-500">Controle de datas e atos processuais</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Voltar ao Início
          </Link>

          <button
            onClick={exportarCSV}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Exportar CSV
          </button>

          <Link
            href="/admin/usuarios"
            className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors"
          >
            Gerenciar Usuários
          </Link>

          <button
            onClick={abrirModalNovoPrazo}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 transition-colors shadow"
          >
            + Novo Prazo
          </button>
        </div>
      </div>

      {/* Tabela de Prazos */}
      {loading ? (
        <p className="text-slate-500 text-center py-8">Carregando dados...</p>
      ) : (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Processo</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prazos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">
                    {p.processos?.numero}{' '}
                    {p.processos?.reclamante ? `(${p.processos.reclamante})` : ''}
                  </td>
                  <td className="p-4">{p.descricao || '-'}</td>
                  <td className="p-4 font-semibold text-slate-700">
                    <div className="flex items-center">
                      <span>{formatarData(p.data_vencimento)}</span>
                      {obterAlertaData(p.data_vencimento, p.status)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'Concluído'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {p.status || 'Pendente'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => abrirModalEditarPrazo(p)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluirPrazo(p.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-xs"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {prazos.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum prazo cadastrado no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Novo/Editar Prazo */}
      {modalPrazoAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">
              {prazoEditando ? 'Editar Prazo' : 'Novo Prazo'}
            </h2>

            <form onSubmit={handleSalvarPrazo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Selecione o Processo *
                </label>
                <select
                  required
                  value={processoId}
                  onChange={(e) => setProcessoId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {processos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numero} {p.reclamante ? `- ${p.reclamante}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Descrição / Ato Processual *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apresentar Manifestação"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  required
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalPrazoAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow"
                >
                  {prazoEditando ? 'Salvar Alterações' : 'Cadastrar Prazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}