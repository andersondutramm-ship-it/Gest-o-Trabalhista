'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PrazosPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span>📅</span> Controle de Prazos
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Acompanhe prazos judiciais, audiências e compromissos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              ← Voltar para a Home
            </Link>
          </div>
        </div>

        {/* Conteúdo dos Prazos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          <p className="text-sm">Nenhum prazo pendente cadastrado.</p>
        </div>

      </div>
    </div>
  );
}