'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  nome: string;
  role: string;
  created_at?: string;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Modal Novo/Editar Usuário
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Profile | null>(null);

  // Form
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('operador');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    verificarAcessoECarregar();
  }, []);

  async function verificarAcessoECarregar() {
    setLoading(true);

    // Verificação do usuário atual e suas permissões
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const { data: perfil } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Permite acesso se a role for 'admin' ou se for o e-mail master principal
    const eAdmin = perfil?.role === 'admin' || user.email === 'dutra.anderson@hotmail.com';
    setIsAdmin(eAdmin);

    if (eAdmin) {
      carregarUsuarios();
    } else {
      setLoading(false);
    }
  }

  async function carregarUsuarios() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  }

  function abrirModalNovo() {
    setUsuarioEditando(null);
    setNome('');
    setEmail('');
    setSenha('');
    setRole('operador');
    setModalAberto(true);
  }

  function abrirModalEditar(u: Profile) {
    setUsuarioEditando(u);
    setNome(u.nome || '');
    setEmail(u.email || '');
    setSenha(''); // Deixar em branco caso não queira alterar
    setRole(u.role || 'operador');
    setModalAberto(true);
  }

  async function handleSalvarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    if (usuarioEditando) {
      // Editar Usuário Existente
      const { error } = await supabase
        .from('profiles')
        .update({ nome, role })
        .eq('id', usuarioEditando.id);

      if (error) {
        alert('Erro ao atualizar perfil: ' + error.message);
      } else {
        alert('Usuário atualizado com sucesso!');
        setModalAberto(false);
        carregarUsuarios();
      }
    } else {
      // Criar Novo Usuário
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome, role },
        },
      });

      if (error) {
        alert('Erro ao criar usuário: ' + error.message);
      } else {
        if (data.user) {
          await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              email,
              nome,
              role,
            },
          ]);
        }
        alert('Novo usuário cadastrado com sucesso!');
        setModalAberto(false);
        carregarUsuarios();
      }
    }

    setSalvando(false);
  }

  async function handleExcluirUsuario(id: string, emailUser: string) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${emailUser}"?`)) return;

    // Remove do cadastro de perfis
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) {
      alert('Erro ao excluir usuário: ' + error.message);
    } else {
      alert('Usuário removido!');
      carregarUsuarios();
    }
  }

  if (loading) {
    return <p className="p-8 text-center text-slate-500">Verificando permissões...</p>;
  }

  if (isAdmin === false) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h1 className="text-xl font-bold text-red-600">Acesso Restrito</h1>
        <p className="text-sm text-slate-600">
          Apenas administradores possuem permissão para acessar o gerenciamento de usuários.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          Voltar ao Início
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Topo / Header */}
      <div className="bg-white p-4 rounded-xl shadow border border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel do Administrador</h1>
          <p className="text-xs text-slate-500">Gerenciamento, edição e exclusão de acesso de usuários</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/"
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Voltar ao Início
          </Link>
          <button
            onClick={abrirModalNovo}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg text-sm hover:bg-purple-700 shadow"
          >
            + Criar Novo Usuário
          </button>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">E-mail</th>
              <th className="p-4">Nível de Acesso</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800">{u.nome || '-'}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {u.role === 'admin' ? 'Administrador' : 'Operador'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => abrirModalEditar(u)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleExcluirUsuario(u.id, u.email)}
                    className="text-red-600 hover:text-red-800 font-medium text-xs"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  Nenhum usuário localizado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">
              {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>

            <form onSubmit={handleSalvarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  disabled={!!usuarioEditando}
                  placeholder="usuario@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {!usuarioEditando && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Senha Inicial</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nível de Permissão</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="operador">Operador (Acesso padrão)</option>
                  <option value="admin">Administrador (Acesso completo)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}