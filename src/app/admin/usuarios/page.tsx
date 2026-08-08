'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Users, Plus, Edit3, Trash2, ArrowLeft, Shield } from 'lucide-react';

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
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Usuário');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsuarios(data);
    setLoading(false);
  }

  function abrirModalCriar() {
    setUsuarioEditando(null);
    setEmail('');
    setRole('Usuário');
    setModalAberto(true);
  }

  function abrirModalEditar(u: Usuario) {
    setUsuarioEditando(u);
    setEmail(u.email);
    setRole(u.role || 'Usuário');
    setModalAberto(true);
  }

  async function handleSalvarUsuario(e: React.FormEvent) {
    e.preventDefault();

    if (usuarioEditando) {
      await supabase.from('profiles').update({ email, role }).eq('id', usuarioEditando.id);
    } else {
      await supabase.from('profiles').insert([{ id: crypto.randomUUID(), email, role }]);
    }

    setModalAberto(false);
    carregarUsuarios();
  }

  async function handleExcluirUsuario(id: string) {
    if (!confirm('Remover este usuário?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    carregarUsuarios();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2 font-serif uppercase tracking-wider">
              <Users className="w-6 h-6" /> Gestão de Usuários
            </h1>
            <p className="text-xs text-neutral-400 mt-1">Controle de acessos e permissões da equipe</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={abrirModalCriar}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/20 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> Cadastrar Usuário
            </button>

            <Link href="/" className="px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
            </Link>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 uppercase font-semibold border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Função</th>
                <th className="px-6 py-4">Data de Criação</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-neutral-500">Carregando usuários...</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-neutral-500">Nenhum usuário cadastrado.</td></tr>
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
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => abrirModalEditar(u)} className="p-1.5 text-neutral-400 hover:text-amber-400">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleExcluirUsuario(u.id)} className="p-1.5 text-neutral-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-neutral-100">{usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSalvarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@escritorio.com"
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
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
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 uppercase tracking-wider"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}