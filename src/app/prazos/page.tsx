'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PaginaPrazos() {
  // --- ESTADOS DOS PRAZOS ---
  const [prazos, setPrazos] = useState<any[]>([
    { id: '1', processo_cnj: '0000000-00.2026.5.02.0000', reclamante: 'Exemplo Reclamante 1', titulo: 'Laudo Pericial', data_vencimento: '2026-08-15' },
    { id: '2', processo_cnj: '1111111-11.2026.5.02.0000', reclamante: 'Exemplo Reclamante 2', titulo: 'Esclarecimentos', data_vencimento: '2026-08-08' }
  ]);

  const [busca, setBusca] = useState('');
  const [filtroUrgencia, setFiltroUrgencia] = useState('todos');

  // --- ESTADO DE EDIÇÃO ---
  const [editPrazoId, setEditPrazoId] = useState<string | null>(null);
  const [processoCnjInput, setProcessoCnjInput] = useState('');
  const [reclamanteInput, setReclamanteInput] = useState('');
  const [tituloInput, setTituloInput] = useState('');
  const [vencimentoInput, setVencimentoInput] = useState('');

  // --- CÁLCULO DE URGÊNCIA ---
  const calcularUrgencia = (dataStr: string) => {
    if (!dataStr) return { texto: 'Sem Data', badge: 'bg-slate-100 text-slate-700 border-slate-300' };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(dataStr);
    dataVenc.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return { texto: 'Vencido', badge: 'bg-rose-100 text-rose-800 border-rose-300' };
    if (diffDias <= 3) return { texto: 'Crítico', badge: 'bg-rose-100 text-rose-800 border-rose-300' };
    if (diffDias <= 7) return { texto: 'Atenção', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { texto: 'OK', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  // --- AÇÕES ---
  const prepararEdicao = (p: any) => {
    setEditPrazoId(p.id);
    setProcessoCnjInput(p.processo_cnj || '');
    setReclamanteInput(p.reclamante || '');
    setTituloInput(p.titulo);
    setVencimentoInput(p.data_vencimento);
  };

  const cancelarEdicao = () => {
    setEditPrazoId(null);
    setProcessoCnjInput('');
    setReclamanteInput('');
    setTituloInput('');
    setVencimentoInput('');
  };

  const handleSalvarPrazo = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPrazoId) {
      setPrazos(prazos.map(p => p.id === editPrazoId ? {
        ...p, processo_cnj: processoCnjInput, reclamante: reclamanteInput, titulo: tituloInput, data_vencimento: vencimentoInput
      } : p));
    } else {
      const novo = { id: Date.now().toString(), processo_cnj: processoCnjInput, reclamante: reclamanteInput, titulo: tituloInput, data_vencimento: vencimentoInput };
      setPrazos([...prazos, novo]);
    }
    cancelarEdicao();
  };

  const excluirPrazo = (id: string) => {
    if (confirm('Deseja realmente excluir este prazo?')) {
      setPrazos(prazos.filter(p => p.id !== id));
    }
  };

  // --- EXPORTAR CSV ---
  const exportarCSV = () => {
    if (prazos.length === 0) return alert('Nenhum prazo para exportar.');
    let conteudo = "CNJ;Reclamante;Titulo;Data Vencimento;Status\n";
    prazos.forEach(p => {
      const urg = calcularUrgencia(p.data_vencimento);
      conteudo += `"${p.processo_cnj}";"${p.reclamante}";"${p.titulo}";"${p.data_vencimento}";"${urg.texto}"\n`;
    });
    const blob = new Blob(["\ufeff" + conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prazos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // --- FILTRAGEM ---
  const prazosFiltrados = prazos.filter(p => {
    const atendeBusca = p.titulo.toLowerCase().includes(busca.toLowerCase()) || 
                         p.processo_cnj.toLowerCase().includes(busca.toLowerCase()) ||
                         p.reclamante.toLowerCase().includes(busca.toLowerCase());
    if (filtroUrgencia === 'todos') return atendeBusca;
    const urg = calcularUrgencia(p.data_vencimento);
    return atendeBusca && urg.texto.toLowerCase() === filtroUrgencia.toLowerCase();
  });

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-900 font-semibold mb-1 inline-block">
              ← Voltar ao Painel Principal
            </Link>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestão Central de Prazos</h1>
          </div>
          <button onClick={exportarCSV} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition">
            📥 Exportar Prazos (CSV)
          </button>
        </header>

        {/* FORMULÁRIO */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">
            {editPrazoId ? '✏️ Editar Prazo' : '➕ Novo Prazo'}
          </h2>
          <form onSubmit={handleSalvarPrazo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input type="text" placeholder="Número CNJ" value={processoCnjInput} onChange={(e) => setProcessoCnjInput(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
            <input type="text" placeholder="Reclamante" value={reclamanteInput} onChange={(e) => setReclamanteInput(e.target.value)} className="p-2.5 border rounded-lg text-xs bg-slate-50" />
            <input type="text" placeholder="Título do Prazo" value={tituloInput} onChange={(e) => setTituloInput(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
            <input type="date" value={vencimentoInput} onChange={(e) => setVencimentoInput(e.target.value)} required className="p-2.5 border rounded-lg text-xs bg-slate-50" />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition">
                {editPrazoId ? 'Atualizar' : 'Lançar'}
              </button>
              {editPrazoId && (
                <button type="button" onClick={cancelarEdicao} className="bg-slate-200 text-slate-700 text-xs px-3 rounded-lg">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* TABELA DE PRAZOS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex gap-2">
              {['todos', 'critico', 'atencao', 'ok', 'vencido'].map(f => (
                <button key={f} onClick={() => setFiltroUrgencia(f)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${filtroUrgencia === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {f}
                </button>
              ))}
            </div>
            <input type="text" placeholder="🔍 Buscar por CNJ, Título..." value={busca} onChange={(e) => setBusca(e.target.value)} className="p-2.5 border rounded-xl text-xs bg-slate-50 w-full sm:w-72" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">CNJ / Reclamante</th>
                  <th className="py-3 px-4">Título do Prazo</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {prazosFiltrados.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400">Nenhum prazo localizado.</td></tr>
                ) : (
                  prazosFiltrados.map((p) => {
                    const urg = calcularUrgencia(p.data_vencimento);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${urg.badge}`}>{urg.texto}</span></td>
                        <td className="py-3 px-4"><p className="font-mono font-semibold text-slate-900">{p.processo_cnj}</p><p className="text-[11px] text-slate-500">{p.reclamante}</p></td>
                        <td className="py-3 px-4 font-medium text-slate-800">{p.titulo}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.data_vencimento}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button onClick={() => prepararEdicao(p)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] font-semibold">Editar</button>
                          <button onClick={() => excluirPrazo(p.id)} className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold">Excluir</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}