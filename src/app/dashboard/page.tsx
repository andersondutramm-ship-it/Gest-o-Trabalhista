'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel Principal</h1>
          <p className="text-sm text-slate-500 mt-2">Escolha uma opção para navegar:</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/processos"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>⚖️</span> Gestão de Processos
          </Link>

          <Link
            href="/prazos"
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>📅</span> Gestão de Prazos
          </Link>

          <Link
            href="/admin/usuarios"
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>👥</span> Gerenciamento de Usuários
          </Link>
        </div>
      </div>
    </div>
  );
}