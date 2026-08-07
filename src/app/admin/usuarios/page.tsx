'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function GestaoUsuarios() {
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [role, setRole] = useState('operador');
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    const { data } = await supabase.from('profiles').select('*');
    setUsuarios(data || []);
  }

  async function handleCadastrarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Criação do usuário no Supabase Auth via Admin / Client API
    const { data, error } = await supabase.auth.signUp({
      email: novoEmail,
      password: novaSenha,
    });

    if (error) {
      alert('Erro ao cadastrar usuário: ' + error.message);
    } else if (data.user) {
      await supabase.from('profiles').insert([{
        id: data.user.id,
        email: novoEmail,
        role: role
      }]);
      alert('Usuário cadastrado com sucesso!');
      setNovoEmail('');
      setNovaSenha('');
      carregarUsuarios();
    }
    setLoading(false);
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Controle de Usuários</h1>

      {/* Formulário de Cadastro de Usuário */}
      <form onSubmit={handleCadastrarUsuario} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h2 className="font-semibold text-slate-700">Cadastrar Novo Usuário</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="email"
            placeholder="E-mail"
            required
            className="p-2 border rounded-lg text-sm"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Senha"
            required
            className="p-2 border rounded-lg text-sm"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
          <select
            className="p-2 border rounded-lg text-sm bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700"
        >
          {loading ? 'Salvando...' : 'Cadastrar Usuário'}
        </button>
      </form>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">E-mail</th>
              <th className="p-4">Nível de Acesso</th>
              <th className="p-4">Data de Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="p-4">{u.email}</td>
                <td className="p-4 capitalize">{u.role}</td>
                <td className="p-4">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}