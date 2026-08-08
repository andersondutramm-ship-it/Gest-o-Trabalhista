'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Users, Plus, Edit3, Trash2, ArrowLeft, Shield, Lock } from 'lucide-react';

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
      // 1. Criar usuário na autenticação do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Criar perfil na tabela profiles
      if (authData.user) {
        await supabase.from('profiles').insert([{ 
          id: authData.user.id, 
          email, 
          role 
        }]);
      }

      alert('Usuário cadastrado com sucesso!');
      setModalAberto(false);
      carregarUsuarios();
    } catch (error: any) {
      alert('Erro ao cadastrar: ' + error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2 font-serif uppercase tracking-wider">
              <Users className="w-6 h-6" /> Gestão de Usuários
            </h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModalAberto(true)} className="px-4 py-2 bg-amber-600 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Usuário
            </button>
            <Link href="/" className="px-4 py-2 border border-neutral-800 text-xs rounded-xl">Voltar</Link>
          </div>
        </div>

        {/* LISTA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase">
              <tr>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-neutral-800">
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">{u.role}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={async () => { await supabase.from('profiles').delete().eq('id', u.id); carregarUsuarios(); }} className="text-red-400"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO COM SENHA */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSalvarUsuario} className="bg-neutral-900 p-6 rounded-2xl w-full max-w-sm space-y-4 border border-neutral-800">
            <h2 className="text-lg font-bold">Cadastrar Acesso</h2>
            
            <input type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-neutral-950 p-2.5 rounded-lg border border-neutral-700 text-xs" />
            
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <input type="password" placeholder="Senha inicial" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-neutral-950 p-2.5 pl-10 rounded-lg border border-neutral-700 text-xs" />
            </div>

            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-neutral-950 p-2.5 rounded-lg border border-neutral-700 text-xs">
              <option value="Usuário">Usuário</option>
              <option value="Administrador">Administrador</option>
            </select>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setModalAberto(false)} className="flex-1 p-2 rounded-lg border border-neutral-700">Cancelar</button>
              <button type="submit" disabled={salvando} className="flex-1 p-2 bg-amber-600 rounded-lg text-neutral-950 font-bold">{salvando ? 'Criando...' : 'Criar Acesso'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}