'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Prazo {
  id: string;
  processo: string;
  descricao: string;
  data_vencimento: string;
  status: 'Pendente' | 'Concluído';
}

export default function PrazosPage() {
  const [loading, setLoading] = useState(true);
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  
  // Form State
  const [processo, setProcesso] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarPrazos();
  }, []);

  async function carregarPrazos() {
    setLoading(true);
    const { data, error } = await supabase.from('prazos').select('*').order('data_vencimento', { ascending: true });

    if (!error && data && data.length > 0) {
      setPrazos(data);
    } else {
      setPrazos([
        {
          id: '1',
          processo: '0001461-80.2014.5.02.0019',
          descricao: 'Apresentar réplica à contestação',
          data_vencimento: '2026-08-15',
          status: 'Pendente',
        },
      ]);
    }
    setLoading(false);
  }

  async function handleCadastrarPrazo(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    const novoPrazo: Prazo = {
      id: String(Date.now()),
      processo,
      descricao,
      data_vencimento: dataVencimento,
      status: 'Pendente',
    };

    try {
      await supabase.from('prazos').insert([novoPrazo]);
      setPrazos((prev) => [...prev, novoPrazo]);
      alert('Prazo cadastrado com sucesso!');
      setModalAberto(false);
      setProcesso('');
      setDescricao('');
      setDataVencimento('');
    } catch {
      setPrazos((prev) => [...prev, novoPrazo]);
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span>📅</span> Gestão de Prazos
            </h1>
            <p className="text-xs text-slate-500 mt-1">Acompanhe e cadastre os prazos processuais urgentes.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalAberto(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              + Novo Prazo
            </button>

            <Link
              href="/"
              className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              ← Voltar para a Home
            </Link>
          </div>
        </div>

        {/* Listagem de Prazos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-base">Prazos Agendados</h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              Total: {prazos.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Processo</th>
                  <th className="px-6 py-3 font-semibold">Descrição do Prazo</th>
                  <th className="px-6 py-3 font-semibold">Vencimento</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prazos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{p.processo}</td>
                    <td className="px-6 py-4">{p.descricao}</td>
                    <td className="px-6 py-4 font-semibold text-amber-600">
                      {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Novo Prazo */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Cadastrar Novo Prazo</h2>

            <form onSubmit={handleCadastrarPrazo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Número do Processo *</label>
                <input
                  type="text"
                  required
                  placeholder="0000000-00.2026.5.02.0000"
                  value={processo}
                  onChange={(e) => setProcesso(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Prazo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apresentar Manifestação"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data de Vencimento *</label>
                <input
                  type="date"
                  required
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 shadow"
                >
                  {salvando ? 'Salvar...' : 'Salvar Prazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}