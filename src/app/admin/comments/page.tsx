"use client";
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/src/components/admin/AdminLayout';
import { useAuth } from '@/src/lib/auth/session';
import { canAccessAdmin } from '@/src/lib/auth/adminAccess';

interface CommentRow { id:string; body:string; status:string; post:{ id:string; title:string|null; slug:string }; author?:{ username:string; displayName?:string|null }; guestName?:string|null; createdAt:string; }

export default function CommentsModerationPage(){
  const { user, loading } = useAuth();
  const [comments,setComments] = useState<CommentRow[]>([]);
  const [filter,setFilter] = useState<'all'|'pending'|'approved'|'spam'>('all');
  const [loadingComments,setLoadingComments]=useState(false);
  const load = async ()=> {
    setLoadingComments(true);
  const qs = filter==='all'? '' : `?status=${filter.toUpperCase()}`;
  const res = await fetch(`/api/comments/admin${qs}`);
    if (res.ok){ const d = await res.json(); setComments(d.comments||[]);} else { setComments([]);}
    setLoadingComments(false);
  };
  useEffect(()=>{ if(!loading && user && canAccessAdmin(user)) load(); },[user,loading,filter]);
  const act = async (id:string, action:'approve'|'spam'|'delete') => { await fetch('/api/comments/admin',{ method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action })}); load(); };
  if (loading) return null; if(!user||!canAccessAdmin(user)) return null;
  return <AdminLayout title="Comments Moderation">
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['all','pending','approved','spam'].map(f=> <button key={f} onClick={()=>setFilter(f as any)} className={`px-3 py-1 rounded text-sm capitalize ${filter===f?'bg-blue-600 text-white':'bg-gray-200 hover:bg-gray-300'}`}>{f}</button>)}
      </div>
      <div className="bg-white border rounded overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Comment</th><th className="px-3 py-2">Post</th><th className="px-3 py-2">Author</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Actions</th></tr></thead>
          <tbody>
            {loadingComments && <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-500">Loading...</td></tr>}
            {!loadingComments && comments.map(c=> <tr key={c.id} className="border-t">
              <td className="px-3 py-2 max-w-md"><div className="line-clamp-3 whitespace-pre-wrap">{c.body}</div></td>
              <td className="px-3 py-2 text-xs text-gray-600">{c.post?.title || c.post?.slug}</td>
              <td className="px-3 py-2 text-xs">{c.author?.displayName || c.author?.username || c.guestName || 'Guest'}</td>
              <td className="px-3 py-2 text-xs"><span className={`inline-block px-2 py-0.5 rounded-full ${c.status==='PENDING'?'bg-yellow-100 text-yellow-800': c.status==='APPROVED'?'bg-green-100 text-green-700': c.status==='SPAM'?'bg-red-100 text-red-700':'bg-gray-200 text-gray-700'}`}>{c.status}</span></td>
              <td className="px-3 py-2 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
              <td className="px-3 py-2 text-xs space-x-1">
                {c.status!=='APPROVED' && <button onClick={()=>act(c.id,'approve')} className="px-2 py-0.5 bg-green-600 text-white rounded">Approve</button>}
                {c.status!=='SPAM' && <button onClick={()=>act(c.id,'spam')} className="px-2 py-0.5 bg-yellow-700 text-white rounded">Spam</button>}
                <button onClick={()=>act(c.id,'delete')} className="px-2 py-0.5 bg-red-600 text-white rounded">Delete</button>
              </td>
            </tr>)}
            {!loadingComments && comments.length===0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">No comments</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>;
}
