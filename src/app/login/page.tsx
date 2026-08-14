'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert(error.message);
    } else {
      router.push('/processos');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
        <h1 className="text-xl font-bold text-amber-400 mb-6">Login</h1>
        <input 
          type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-neutral-950 border border-neutral-800 rounded-xl text-white"
        />
        <input 
          type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full p-3 mb-6 bg-neutral-950 border border-neutral-800 rounded-xl text-white"
        />
        <button className="w-full p-3 bg-amber-600 text-neutral-950 font-bold rounded-xl">Entrar</button>
      </form>
    </div>
  );
}