'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Usuario {
  id: string;
  email: string;
  nome: string;
  role: string;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('operador');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsuarios(data);
  }

  async function handleCadastrarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    // Cria o usuário na autenticação do Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, role },
      },
    });

    if (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao cadastrar: ' + error.message });
    } else {
      // Grava o perfil na tabela de perfis
      if (data.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email,
            nome,
            role,
          },
        ]);
      }

      setMensagem({ tipo: 'sucesso', texto: 'Usuário cadastrado com sucesso!' });
      setNome('');
      setEmail('');
      setSenha('');
      carregarUsuarios();
    }
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gerenciamento de Usuários</h1>
        <p className="text-sm text-slate-500">Cadastre novos usuários que terão acesso ao sistema</p>
      </div>

      {mensagem && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {/* Form de Cadastro */}
      <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Cadastrar Novo Usuário</h2>
        <form onSubmit={handleCadastrarUsuario} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail de Acesso</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Senha Inicial</label>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nível de Permissão</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="operador">Operador (Acesso padrão)</option>
              <option value="admin">Administrador (Acesso total)</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 shadow disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Usuários Existentes */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-700">Usuários Cadastrados</div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">E-mail</th>
              <th className="p-4">Nível</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="p-4 font-medium text-slate-800">{u.nome || '-'}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}