"use client";
import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/src/components/admin/AdminLayout';
import { useAuth } from '@/src/lib/auth/session';
import { canCreateContent } from '@/src/lib/auth/adminAccess';
import { FeatherDynamicFields } from '@/src/components/admin/FeatherDynamicFields';

export default function EditPostPage(){
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [saving,setSaving]=useState(false);
  const [data,setData]=useState<any|null>(null);
  const [feathers,setFeathers]=useState<any[]>([]);
  useEffect(()=>{ if(!loading && user && canCreateContent(user)){
    fetch(`/api/posts/${id}`).then(r=> r.ok? r.json():null).then(d=>{ if(d?.data || d?.post) setData(d.data||d.post); });
    fetch('/api/feathers').then(r=>r.ok?r.json():null).then(d=> setFeathers(d?.feathers||[]));
  } },[user,loading,id]);
  if (loading) return null; if(!user||!canCreateContent(user)) return null;
  const update = async () => { if(!data) return; setSaving(true); await fetch(`/api/posts/${id}`,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title:data.title, body:data.body, excerpt:data.excerpt, featherData: data.featherData }) }); setSaving(false); router.push('/admin/manage'); };
  return <AdminLayout title={data?`Edit: ${data.title}`:'Edit Post'}>
    <Script id="max-upload-bytes-edit" strategy="afterInteractive">
      {`window.__MAX_UPLOAD_BYTES__ = ${parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || process.env.MAX_UPLOAD_BYTES || '0',10) || 0};`}
    </Script>
    {!data && <div className="text-sm text-gray-500">Loading...</div>}
    {data && <div className="space-y-4 max-w-3xl">
      <input value={data.title||''} onChange={e=>setData({...data,title:e.target.value})} className="w-full px-3 py-2 border rounded" />
      <textarea rows={14} value={data.body||''} onChange={e=>setData({...data,body:e.target.value})} className="w-full px-3 py-2 border rounded" />
      {feathers.filter(f=> f.slug===data.feather).map(f=> <div key={f.slug} className="bg-white border rounded p-4">
        <h3 className="font-medium mb-2">{f.name} Options</h3>
  <FeatherDynamicFields fields={f.fields} value={data.featherData} onChange={(val)=> setData({...data, featherData: val})} maxBytes={parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || process.env.MAX_UPLOAD_BYTES || '0',10) || undefined} />
      </div>)}
      <textarea rows={3} value={data.excerpt||''} onChange={e=>setData({...data,excerpt:e.target.value})} className="w-full px-3 py-2 border rounded" />
      <div className="flex gap-3">
        <button onClick={update} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">{saving?'Saving...':'Save'}</button>
        <button onClick={()=>router.push('/admin/manage')} className="px-4 py-2 bg-gray-200 rounded text-sm">Cancel</button>
      </div>
    </div>}
  </AdminLayout>;
}
