'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function GestaoProcessos() {
  // --- ESTADOS DOS DADOS ---
  const [processos, setProcessos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // --- BUSCAR DADOS DO SUPABASE ---
  useEffect(() => {
    async function carregarProcessos() {
      try {
        setLoading(true);
        setErro(null);

        const { data, error } = await supabase
          .from('processos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setProcessos(data || []);
      } catch (err: any) {
        console.error('Erro ao carregar processos:', err.message);
        setErro('Não foi possível carregar os processos.');
      } finally {
        setLoading(false);
      }
    }

    carregarProcessos();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestão Trabalhista</h1>
            <p className="text-slate-500 text-sm">Acompanhamento e controle de processos judiciais</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/prazos"
              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
            >
              Ver Prazos
            </Link>
          </div>
        </div>

        {/* ALERTA DE ERRO */}
        {erro && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erro}
          </div>
        )}

        {/* LISTAGEM / TABELA DE PROCESSOS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Processos Cadastrados</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Carregando processos...
            </div>
          ) : processos.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nenhum processo encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-4 font-semibold">Número do Processo</th>
                    <th className="p-4 font-semibold">Reclamante</th>
                    <th className="p-4 font-semibold">Reclamada</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processos.map((proc) => (
                    <tr key={proc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{proc.numero || 'N/A'}</td>
                      <td className="p-4 text-slate-600">{proc.reclamante || '-'}</td>
                      <td className="p-4 text-slate-600">{proc.reclamada || '-'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {proc.status || 'Em andamento'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}