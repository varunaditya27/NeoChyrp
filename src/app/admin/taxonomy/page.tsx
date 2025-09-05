"use client";
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/src/components/admin/AdminLayout';
import { useAuth } from '@/src/lib/auth/session';
import { canAccessAdmin } from '@/src/lib/auth/adminAccess';

interface Tag { id:string; name:string; slug:string; count?:number; }
interface Category { id:string; name:string; slug:string; parentId?:string|null; }

export default function TaxonomyPage(){
  const { user, loading } = useAuth();
  const [tags,setTags] = useState<Tag[]>([]);
  const [categories,setCategories] = useState<Category[]>([]);
  const [newTag,setNewTag] = useState('');
  const [newCat,setNewCat] = useState('');
  const load = async ()=>{
    const t = await fetch('/api/tags?type=popular&limit=100');
    if (t.ok) { const d = await t.json(); setTags(d.tags||[]);}
    const c = await fetch('/api/categories'); if (c.ok){ const d = await c.json(); setCategories(d.categories||d.data||[]);}  };
  useEffect(()=>{ if(!loading && user && canAccessAdmin(user)) load(); },[user,loading]);
  if (loading) return null; if(!user||!canAccessAdmin(user)) return null;
  const createTag = async ()=>{ if(!newTag) return; await fetch('/api/tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ name:newTag, slug:newTag.toLowerCase().replace(/[^a-z0-9]+/g,'-') })}); setNewTag(''); load(); };
  const createCategory = async ()=>{ if(!newCat) return; await fetch('/api/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ name:newCat, slug:newCat.toLowerCase().replace(/[^a-z0-9]+/g,'-') })}); setNewCat(''); load(); };
  return <AdminLayout title="Taxonomy">
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-white p-4 border rounded">
        <h2 className="font-semibold mb-3">Tags</h2>
        <div className="flex gap-2 mb-3">
          <input value={newTag} onChange={e=>setNewTag(e.target.value)} placeholder="New tag" className="flex-1 px-2 py-1 border rounded" />
          <button onClick={createTag} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add</button>
        </div>
        <ul className="space-y-1 max-h-72 overflow-auto">
          {tags.map(t=> <li key={t.slug} className="flex justify-between items-center text-sm"><span>{t.name}</span><span className="text-xs text-gray-500">{t.count||''}</span></li>)}
          {tags.length===0 && <li className="text-xs text-gray-500">No tags</li>}
        </ul>
      </div>
      <div className="bg-white p-4 border rounded">
        <h2 className="font-semibold mb-3">Categories</h2>
        <div className="flex gap-2 mb-3">
          <input value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="New category" className="flex-1 px-2 py-1 border rounded" />
          <button onClick={createCategory} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add</button>
        </div>
        <ul className="space-y-1 max-h-72 overflow-auto">
          {categories.map(c=> <li key={c.slug} className="text-sm">{c.name}</li>)}
          {categories.length===0 && <li className="text-xs text-gray-500">No categories</li>}
        </ul>
      </div>
    </div>
  </AdminLayout>;
}
