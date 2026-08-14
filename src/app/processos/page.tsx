'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Briefcase, Plus, Trash2, Search, X } from 'lucide-react';

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState('');
  
  const [formData, setFormData] = useState({
    numero: '',
    reclamante: '',
    reclamada: ''
  });

  // Carregar os processos do Supabase
  async function carregarProcessos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error("Erro ao carregar do Supabase:", error.message);
      } else {
        setProcessos(data || []);
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProcessos();
  }, []);

  // Salvar novo processo no Supabase
  async function salvarProcesso(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('processos')
        .insert([
          {
            numero_cnj: formData.numero,
            reclamante: formData.reclamante,
            reclamada: formData.reclamada
          }
        ]);

      if (error) {
        alert("Erro ao salvar processo: " + error.message);
        return;
      }

      // Sucesso
      setModalAberto(false);
      setFormData({ numero: '', reclamante: '', reclamada: '' });
      carregarProcessos();

    } catch (err: any) {
      alert("Erro de conexão ao salvar processo.");
    }
  }

  // Excluir processo
  async function excluirProcesso(id: string) {
    if (confirm('Deseja realmente excluir este processo?')) {
      const { error } = await supabase
        .from('processos')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Erro ao excluir: " + error.message);
      } else {
        carregarProcessos();
      }
    }
  }

  const processosFiltrados = processos.filter(p => 
    p.reclamante?.toLowerCase().includes(busca.toLowerCase()) ||
    p.numero_cnj?.toLowerCase().includes(busca.toLowerCase()) ||
    p.reclamada?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
          <div>
            <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
              <Briefcase /> Gestão de Processos Trabalhistas
            </h1>
            <p className="text-neutral-400 text-sm">Painel Principal & Controle Jurídico</p>
          </div>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => setModalAberto(true)} 
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-900/25"
            >
              <Plus size={18} /> Novo Processo
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center gap-3">
          <Search className="text-neutral-500" size={20} />
          <input 
            type="text"
            placeholder="Pesquisar por Reclamante, Número ou Reclamada..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <span className="text-xs text-neutral-500 whitespace-nowrap">
            Exibindo: {processosFiltrados.length} processos
          </span>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4">Processo / Número</th>
                  <th className="p-4">Reclamante</th>
                  <th className="p-4">Reclamada</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-neutral-500">Carregando dados...</td>
                  </tr>
                ) : processosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-neutral-500">Nenhum processo encontrado.</td>
                  </tr>
                ) : (
                  processosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="p-4 font-mono text-amber-400 font-medium">{p.numero_cnj || '-'}</td>
                      <td className="p-4 font-medium">{p.reclamante || '-'}</td>
                      <td className="p-4 text-neutral-300">{p.reclamada || '-'}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => excluirProcesso(p.id)} 
                          className="text-neutral-500 hover:text-red-400 p-2 transition-colors"
                          title="Excluir Processo"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={salvarProcesso} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-lg text-amber-400">Cadastrar Novo Processo</h2>
              <button type="button" onClick={() => setModalAberto(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Número do Processo (CNJ)</label>
              <input 
                required 
                placeholder="Ex: 0000000-00.2026.5.02.0000" 
                value={formData.numero}
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-amber-600" 
                onChange={e => setFormData({...formData, numero: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Reclamante</label>
              <input 
                required 
                placeholder="Nome do Reclamante" 
                value={formData.reclamante}
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-amber-600" 
                onChange={e => setFormData({...formData, reclamante: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Reclamada</label>
              <input 
                required 
                placeholder="Nome da Reclamada" 
                value={formData.reclamada}
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-amber-600" 
                onChange={e => setFormData({...formData, reclamada: e.target.value})} 
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button" 
                onClick={() => setModalAberto(false)}
                className="w-1/2 p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="w-1/2 p-3 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-900/25"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}