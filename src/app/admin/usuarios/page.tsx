'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Users, Plus, Trash2, Lock, Shield, ArrowLeft } from 'lucide-react';

interface Usuario {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  
  // States do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Usuário');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsuarios(data);
    setLoading(false);
  }

  async function handleSalvarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    try {
      // 1. Criar o usuário no Auth (utilizando signUp padrão do client para evitar conflito de chave de serviço)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Criar ou atualizar o perfil na tabela profiles associado ao ID gerado
      if (authData.user) {
        const { error: insertError } = await supabase.from('profiles').upsert([{ 
          id: authData.user.id, 
          email, 
          role 
        }]);

        if (insertError) throw insertError;
      }

      alert('Usuário cadastrado com sucesso!');
      setModalAberto(false);
      setEmail('');
      setPassword('');
      setRole('Usuário');
      carregarUsuarios();
    } catch (error: any) {
      console.error(error);
      alert('Erro ao cadastrar: ' + error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirUsuario(id: string) {
    if (!confirm('Deseja realmente remover este usuário?')) return;
    
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      carregarUsuarios();
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2 font-serif uppercase tracking-wider">
              <Users className="w-6 h-6" /> Gestão de Usuários
            </h1>
            <p className="text-xs text-neutral-400 mt-1">Controle de acessos e permissões do sistema</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setModalAberto(true)} 
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/20 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> Novo Usuário
            </button>
            <Link href="/" className="px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
            </Link>
          </div>
        </div>

        {/* LISTA DE USUÁRIOS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Cargo / Função</th>
                <th className="px-6 py-4">Data de Criação</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-neutral-500">Carregando usuários...</td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-neutral-500">Nenhum usuário cadastrado.</td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-neutral-200">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 text-amber-400 rounded-md text-[10px] flex items-center gap-1 w-fit">
                        <Shield className="w-3 h-3" /> {u.role || 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleExcluirUsuario(u.id)} 
                        className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Users className="w-5 h-5 text-amber-400" /> Cadastrar Novo Acesso
            </h2>
            
            <form onSubmit={handleSalvarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">E-mail *</label>
                <input 
                  type="email" 
                  placeholder="usuario@escritorio.com" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Senha Inicial *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Função / Cargo</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Usuário">Usuário</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Advogado">Advogado</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button 
                  type="button" 
                  onClick={() => setModalAberto(false)} 
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={salvando} 
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 uppercase tracking-wider"
                >
                  {salvando ? 'Criando...' : 'Criar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}