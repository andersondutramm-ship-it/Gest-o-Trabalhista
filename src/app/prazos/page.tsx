'use client';

import React, { useState, useEffect } from 'react';
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
  const [modalAberto, setModalAberto] = useState(false);

  // Campos do formulário
  const [processoId, setProcessoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [status, setStatus] = useState('Pendente');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);

    // 1. Carrega lista de processos para o Select
    const { data: dadosProcessos } = await supabase
      .from('processos')
      .select('id, numero, reclamante')
      .order('numero', { ascending: true });

    if (dadosProcessos) {
      setProcessos(dadosProcessos);
      if (dadosProcessos.length > 0) {
        setProcessoId(dadosProcessos[0].id);
      }
    }

    // 2. Carrega lista de prazos já salvos
    const { data: dadosPrazos } = await supabase
      .from('prazos')
      .select('*, processos(numero, reclamante)')
      .order('data_vencimento', { ascending: true });

    if (dadosPrazos) {
      setPrazos(dadosPrazos);
    }

    setLoading(false);
  }

  async function handleSalvarPrazo(e: React.FormEvent) {
    e.preventDefault();

    if (!processoId) {
      alert('Selecione um processo.');
      return;
    }

    const { error } = await supabase.from('prazos').insert([
      {
        processo_id: processoId,
        descricao,
        data_vencimento: dataVencimento,
        status,
      },
    ]);

    if (error) {
      alert('Erro ao cadastrar prazo: ' + error.message);
    } else {
      setModalAberto(false);
      setDescricao('');
      setDataVencimento('');
      carregarDados();
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Gestão de Prazos</h1>
        <button
          onClick={() => setModalAberto(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow"
        >
          + Novo Prazo
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Processo</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prazos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">
                    {p.processos?.numero} {p.processos?.reclamante ? `(${p.processos.reclamante})` : ''}
                  </td>
                  <td className="p-4">{p.descricao}</td>
                  <td className="p-4">{new Date(p.data_vencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'Concluído'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {prazos.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    Nenhum prazo cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Novo Prazo */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Novo Prazo</h2>

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
                  {processos.length === 0 ? (
                    <option value="">Nenhum processo cadastrado</option>
                  ) : (
                    processos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.numero} {p.reclamante ? `- ${p.reclamante}` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Descrição / Ato Processual *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apresentar Réplica"
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
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}