"use client";
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/src/components/admin/AdminLayout';
import { useAuth } from '@/src/lib/auth/session';
import { canAccessAdmin } from '@/src/lib/auth/adminAccess';

interface ModuleRow { id:string; slug:string; name:string; version:string; description?:string; enabled:boolean; }

export default function ModulesAdminPage() {
  const { user, loading } = useAuth();
  const [modules,setModules] = useState<ModuleRow[]>([]);
  const [creating,setCreating] = useState(false);
  const [form,setForm] = useState({ slug:'', name:'', description:'' });

  const load = async () => {
    const res = await fetch('/api/modules');
    if (res.ok) {
      const data = await res.json();
      setModules(data.modules || []);
    }
  };
  useEffect(()=>{ if(!loading && user && canAccessAdmin(user)) load(); },[user,loading]);
  if (loading) return null;
  if (!user || !canAccessAdmin(user)) return null;

  const toggle = async (slug:string, enabled:boolean) => {
    await fetch(`/api/modules/${slug}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ enabled }) });
    load();
  };
  const create = async () => {
    setCreating(true);
    await fetch('/api/modules', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    setForm({ slug:'', name:'', description:'' });
    setCreating(false);
    load();
  };
  return <AdminLayout title="Modules">
    <div className="space-y-6">
      <div className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-3">Register Module</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="slug" value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value.trim().toLowerCase()}))} className="px-2 py-1 border rounded" />
          <input placeholder="name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="px-2 py-1 border rounded" />
          <input placeholder="description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="px-2 py-1 border rounded" />
        </div>
        <button disabled={!form.slug||!form.name||creating} onClick={create} className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50">{creating?'Creating...':'Create'}</button>
      </div>
      <div className="bg-white rounded border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2">Version</th><th className="px-4 py-2">Enabled</th><th className="px-4 py-2">Actions</th></tr>
          </thead>
          <tbody>
            {modules.map(m=> <tr key={m.slug} className="border-t">
              <td className="px-4 py-2 text-left">
                <div className="font-medium">{m.name}</div>
                <div className="text-gray-500 text-xs">{m.description}</div>
              </td>
              <td className="px-4 py-2 text-center">{m.version}</td>
              <td className="px-4 py-2 text-center">{m.enabled? 'Yes':'No'}</td>
              <td className="px-4 py-2 text-center"><button onClick={()=>toggle(m.slug,!m.enabled)} className="px-2 py-1 rounded bg-indigo-600 text-white text-xs">{m.enabled?'Disable':'Enable'}</button></td>
            </tr>)}
            {modules.length===0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No modules</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>;
}
