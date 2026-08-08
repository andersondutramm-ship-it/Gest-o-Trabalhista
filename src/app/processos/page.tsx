'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Processo {
  id?: string;
  numero_processo: string;
  cliente: string;
  tribunal: string;
  status: string;
  created_at?: string;
}

export default function ProcessosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processos, setProcessos] = useState<Processo[]>([]);
  
  // Estados do formulário de novo processo
  const [modalAberto, setModalAberto] = useState(false);
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [cliente, setCliente] = useState('');
  const [tribunal, setTribunal] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    verificarAcessoEBuscarDados();
  }, []);

  async function verificarAcessoEBuscarDados() {
    setLoading(true);
    
    // VERIFICAÇÃO DE LOGIN COMENTADA TEMPORARIAMENTE PARA TESTES
    /*
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    */

    // Busca os processos cadastrados no Supabase
    await carregarProcessos();
    setLoading(false);
  }

  async function carregarProcessos() {
    const { data, error } = await supabase
      .from('processos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Nota: Se a tabela "processos" não existir no Supabase, crie-a no seu painel.', error.message);
    } else if (data) {
      setProcessos(data);
    }
  }

  async function handleCadastrarProcesso(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    try {
      const novoProcesso = {
        numero_processo: numeroProcesso,
        cliente,
        tribunal,
        status,
      };

      const { error } = await supabase.from('processos').insert([novoProcesso]);

      if (error) throw error;

      alert('Processo cadastrado com sucesso!');
      setModalAberto(false);
      
      // Limpa os campos do formulário
      setNumeroProcesso('');
      setCliente('');
      setTribunal('');
      setStatus('Ativo');

      // Recarrega a listagem
      await carregarProcessos();
    } catch (err: any) {
      alert('Erro ao cadastrar processo: ' + (err.message || 'Verifique se a tabela "processos" existe no seu Supabase.'));
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Carregando modulo de processos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span>⚖️</span> Gestão de Processos
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre, pesquise e acompanhe suas ações judiciais.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalAberto(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <span>+</span> Novo Processo
            </button>

            <Link
              href="/"
              className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              ← Voltar para a Home
            </Link>
          </div>
        </div>

        {/* Tabela de Listagem de Processos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-base">Processos Cadastrados</h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              Total: {processos.length}
            </span>
          </div>

          {processos.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm">Nenhum processo cadastrado até o momento.</p>
              <p className="text-xs mt-1">Clique em "Novo Processo" para adicionar um registro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Número do Processo</th>
                    <th className="px-6 py-3 font-semibold">Cliente / Parte</th>
                    <th className="px-6 py-3 font-semibold">Tribunal / Vara</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processos.map((proc, index) => (
                    <tr key={proc.id || index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{proc.numero_processo}</td>
                      <td className="px-6 py-4">{proc.cliente}</td>
                      <td className="px-6 py-4">{proc.tribunal}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          proc.status === 'Ativo' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {proc.status}
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

      {/* Modal de Cadastro de Processo */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Cadastrar Novo Processo</h2>
            <p className="text-xs text-slate-500">Insira os dados essenciais para o acompanhamento processual.</p>

            <form onSubmit={handleCadastrarProcesso} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Número do Processo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 0000000-00.2026.8.26.0000"
                  value={numeroProcesso}
                  onChange={(e) => setNumeroProcesso(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cliente / Parte *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tribunal / Vara *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 2ª Vara Cível de São Paulo"
                  value={tribunal}
                  onChange={(e) => setTribunal(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status do Processo</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Suspenso">Suspenso</option>
                  <option value="Arquivado">Arquivado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow transition-colors disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Processo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}