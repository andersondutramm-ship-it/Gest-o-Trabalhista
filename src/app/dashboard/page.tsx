'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Processo {
  id?: string;
  numero_processo: string;
  reclamante: string;
  reclamada: string;
  valor_causa: number;
  honorarios: number;
  status: string;
  created_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuarioEmail, setUsuarioEmail] = useState('dutra.anderson@hotmail.com');
  const [processos, setProcessos] = useState<Processo[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);

    // Obtém o usuário logado no Supabase (se houver)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setUsuarioEmail(session.user.email);
    }

    // Busca os processos da tabela
    const { data, error } = await supabase
      .from('processos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProcessos(data);
    } else {
      // Dados de exemplo para renderizar caso a tabela esteja vazia ou em configuração
      setProcessos([
        {
          id: '1',
          numero_processo: '0001461-80.2014.5.02.0019',
          reclamante: 'HILDINEI ANDRADE ALVES BARBOSA SAMPAIO',
          reclamada: 'MULT FUNCIONAL - MAO DE OBRA TERCEIRIZADA LTDA.',
          valor_causa: 19076.51,
          honorarios: 5722.65,
          status: 'Em andamento',
        },
      ]);
    }

    setLoading(false);
  }

  // Cálculos dos Cards
  const totalProcessos = processos.length;
  const emAndamento = processos.filter((p) => p.status === 'Em andamento' || p.status === 'Ativo').length;
  const parados = processos.filter((p) => p.status === 'Parado' || p.status === 'Suspenso').length;
  const totalValorCausa = processos.reduce((acc, p) => acc + (Number(p.valor_causa) || 0), 0);
  const totalHonorarios = processos.reduce((acc, p) => acc + (Number(p.honorarios) || 0), 0);

  function formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. CABEÇALHO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestão Trabalhista</h1>
            <p className="text-xs text-slate-500 mt-1">Usuário: {usuarioEmail}</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium rounded-lg transition-colors">
              Exportar CSV
            </button>

            <Link
              href="/prazos"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              Ver Prazos
            </Link>

            <Link
              href="/processos"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              + Novo Processo
            </Link>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* 2. CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL DE PROCESSOS</p>
            <p className="text-3xl font-bold text-slate-800">{totalProcessos}</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">EM ANDAMENTO</p>
            <p className="text-3xl font-bold text-blue-600">{emAndamento}</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PARADOS (+60 DIAS)</p>
            <p className="text-3xl font-bold text-slate-800">{parados}</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL VALOR DA CAUSA</p>
            <p className="text-xl font-bold text-slate-800">{formatarMoeda(totalValorCausa)}</p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL HONORÁRIOS</p>
            <p className="text-xl font-bold text-emerald-600">{formatarMoeda(totalHonorarios)}</p>
          </div>
        </div>

        {/* 3. TABELA DE PROCESSOS CADASTRADOS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Processos Cadastrados</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs text-slate-700 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Número</th>
                  <th className="px-6 py-4">Reclamante</th>
                  <th className="px-6 py-4">Reclamada</th>
                  <th className="px-6 py-4">Valor da Causa</th>
                  <th className="px-6 py-4">Honorários</th>
                  <th className="px-6 py-4">Status / Alerta</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processos.map((proc, index) => (
                  <tr key={proc.id || index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{proc.numero_processo}</td>
                    <td className="px-6 py-4 uppercase">{proc.reclamante}</td>
                    <td className="px-6 py-4 uppercase">{proc.reclamada}</td>
                    <td className="px-6 py-4">{formatarMoeda(proc.valor_causa)}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">
                      {formatarMoeda(proc.honorarios)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium inline-block">
                        {proc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button className="text-xs text-blue-600 hover:underline font-medium">Editar</button>
                      <button className="text-xs text-red-500 hover:underline font-medium">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}