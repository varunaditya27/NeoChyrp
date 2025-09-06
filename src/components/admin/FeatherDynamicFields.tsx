"use client";
import Image from 'next/image';
import React, { useState, useCallback } from 'react';

import { MarkdownEditor } from '@/src/components/markdown/MarkdownEditor';

interface FeatherFieldDef {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  multiple?: boolean;
  accept?: string;
}
interface Props { fields: FeatherFieldDef[]; value:any; onChange:(val:any)=>void; deferUploads?: boolean; maxBytes?: number; }

export const FeatherDynamicFields: React.FC<Props> = ({ fields, value, onChange, deferUploads, maxBytes }) => {
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({}); // key => percent
  const update = (name:string, val:any) => onChange({ ...(value||{}), [name]: val });
  const uploadFile = useCallback((file: File, onProgress: (pct:number)=>void) => {
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/assets/upload');
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(e); }
          } else {
            reject(new Error('Upload failed'));
          }
        }
      };
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      const fd = new FormData();
      fd.append('file', file);
      xhr.send(fd);
    });
  }, []);

  const effectiveMax = maxBytes || (typeof window !== 'undefined' ? parseInt((window as any).__MAX_UPLOAD_BYTES__ || '0',10) || undefined : undefined);

  function fileTooLarge(f: File) {
    return effectiveMax !== undefined && f.size > effectiveMax;
  }

  async function handleUploadSingle(field: FeatherFieldDef, file: File) {
    if (fileTooLarge(file)) {
      alert(`File exceeds maximum size ${(effectiveMax!/1024/1024).toFixed(2)} MB`);
      return;
    }
    if (deferUploads) {
      // Store placeholder locally (no network yet)
      const expectId = field.name.toLowerCase().includes('image') || field.name === 'imageId';
      const placeholder = {
        _file: file,
        _expect: expectId ? 'id' : 'url',
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
      update(field.name, placeholder);
      return;
    }
    setUploadingField(field.name);
    const key = `${field.name}::single`;
    setProgress(p=>({ ...p, [key]: 0 }));
    try {
      const json = await uploadFile(file, pct=> setProgress(p=>({ ...p, [key]: pct })));
      if (!json?.data) throw new Error(json?.error || 'Upload failed');
      if (field.name.toLowerCase().includes('image') || field.name === 'imageId') {
        // For image fields, always store the asset ID (not the URL)
        update(field.name, json.data.id);
      } else {
        update(field.name, json.data.url);
      }
      setProgress(p=>({ ...p, [key]: 100 }));
    } catch (e:any) {
      setProgress(p=>({ ...p, [key]: 0 }));
      alert(e.message || 'Upload failed');
    } finally {
      setTimeout(()=> setUploadingField(null), 400);
    }
  }

  async function handleUploadMultiple(field: FeatherFieldDef, files: FileList) {
    const valid = Array.from(files).filter(f=> {
      if (fileTooLarge(f)) {
        alert(`File '${f.name}' exceeds maximum size ${(effectiveMax!/1024/1024).toFixed(2)} MB`);
        return false;
      }
      return true;
    });
    if (!valid.length) return;
    if (deferUploads) {
      const existing = Array.isArray(value?.[field.name]) ? value[field.name] : [];
      const additions = Array.from(files).map(file => ({
        _file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      update(field.name, [...existing, ...additions]);
      return;
    }
    setUploadingField(field.name);
    const existing = Array.isArray(value?.[field.name]) ? value[field.name] : [];
    const results: any[] = [...existing];
    try {
      for (const file of valid) {
        const k = `${field.name}:${file.name}:${file.size}`;
        setProgress(p=>({ ...p, [k]: 0 }));
        try {
          const json = await uploadFile(file, pct=> setProgress(p=>({ ...p, [k]: pct })));
          if (json?.data) {
            results.push({
              url: json.data.url,
              name: file.name,
              size: file.size,
              type: file.type,
              thumbnail: json.data.thumbnailUrl || undefined
            });
            setProgress(p=>({ ...p, [k]: 100 }));
          } else {
            setProgress(p=>({ ...p, [k]: 0 }));
          }
        } catch (e:any) {
          setProgress(p=>({ ...p, [k]: 0 }));
        }
      }
      update(field.name, results);
    } finally {
      setTimeout(()=> setUploadingField(null), 500);
    }
  }

  if (!fields || !fields.length) return null;

  const buildDropHandlers = (field: FeatherFieldDef, multiple: boolean) => {
    return {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;
        if (multiple) handleUploadMultiple(field, files);
        else if (files[0]) handleUploadSingle(field, files[0]);
      }
    };
  };

  // Only render required fields per feather
  const requiredFields = Array.isArray(fields) ? fields.filter(f => !!f.required) : [];

  return <div className="space-y-4">
    {requiredFields.map(f=> {
      const val = value?.[f.name];
      const common = {
        id: f.name,
        name: f.name,
        value: (val ?? ''),
        onChange: (e: any)=> update(f.name, e.target.type==='checkbox'? e.target.checked : e.target.value),
        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      } as any;
      return <div key={f.name}>
  <label htmlFor={f.name} className="mb-2 block text-sm font-medium text-gray-700">{f.label}</label>
        {f.type === 'markdown' && (
          <MarkdownEditor
            value={val || ''}
            onChange={(v)=> update(f.name, v)}
            heightClass="h-64"
            description={f.placeholder || 'Markdown supported with preview.'}
            className="!border-gray-300"
          />
        )}
        {f.type==='textarea' && <textarea rows={4} {...common} placeholder={f.placeholder} /> }
        {['text','url','number'].includes(f.type) && <input type={f.type==='number'?'number':'text'} {...common} placeholder={f.placeholder} />}
        {f.type === 'select' && (
          <select
            id={f.name}
            name={f.name}
            value={val ?? ''}
            onChange={(e)=> update(f.name, e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(f.options || []).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        {['boolean','checkbox'].includes(f.type) && <input type="checkbox" checked={!!val} onChange={(e)=>update(f.name,e.target.checked)} />}
        {f.type === 'media' && (
          <div className="space-y-2">
            <div
              className={`cursor-pointer rounded border-2 border-dashed bg-gray-50 p-4 text-xs text-gray-600 transition hover:bg-gray-100 ${uploadingField===f.name?'opacity-60':''}`}
              onClick={()=> document.getElementById(`${f.name}-file-input`)?.click()}
              {...buildDropHandlers(f,false)}
            >
              {!val && (f.placeholder || 'Click or drag & drop a file here')}
              {val && deferUploads && (val as any).previewUrl && <div className="flex items-center gap-2">
                <Image src={(val as any).previewUrl} alt={(val as any).name} width={40} height={40} className="size-10 rounded object-cover" />
                <span className="truncate text-xs text-green-700">{(val as any).name}</span>
              </div>}
              {val && deferUploads && !(val as any).previewUrl && <div className="truncate text-xs text-green-700">{(val as any).name}</div>}
              {val && !deferUploads && <div className="truncate text-xs text-green-700">{typeof val==='string'?val:(val as any).url||val}</div>}
              {!deferUploads && uploadingField===f.name && <div className="mt-2">Uploading... {progress[`${f.name}::single`]??0}%
                <div className="mt-1 h-1 rounded bg-gray-200"><div className="h-1 rounded bg-blue-500" style={{width:`${progress[`${f.name}::single`]||0}%`}}/></div>
              </div>}
            </div>
            <input id={`${f.name}-file-input`} className="hidden" type="file" accept={f.accept || 'image/*,video/*,audio/*'} onChange={(e)=> e.target.files && e.target.files[0] && handleUploadSingle(f, e.target.files[0])} />
          </div>
        )}
        {f.type === 'file-list' && (
          <div className="space-y-2">
            <div
              className={`rounded border-2 border-dashed bg-gray-50 p-4 text-xs text-gray-600 transition hover:bg-gray-100 ${uploadingField===f.name?'opacity-60':''}`}
              onClick={()=> document.getElementById(`${f.name}-multi-input`)?.click()}
              {...buildDropHandlers(f,true)}
            >
              {f.placeholder || 'Drag & drop files here or click to select'}
            </div>
            <input id={`${f.name}-multi-input`} className="hidden" multiple type="file" accept={f.accept} onChange={(e)=> e.target.files && handleUploadMultiple(f, e.target.files)} />
            {Array.isArray(val) && val.length > 0 && (
              <ul className="max-h-52 space-y-1 overflow-auto rounded border border-gray-200 bg-white p-2 text-xs">
                {val.map((fItem:any,i:number)=>{
                  const k = `${f.name}:${fItem.name}:${fItem.size||0}`;
                  const pct = progress[k];
                  return (
                    <li key={k} className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex flex-1 items-center gap-2 truncate" title={fItem.name}>
                          {deferUploads && fItem.previewUrl && <Image src={fItem.previewUrl} alt={fItem.name} width={24} height={24} className="size-6 rounded object-cover" />}
                          {fItem.name}
                        </span>
                        <button type="button" className="text-red-500" onClick={()=>{
                          const next = val.filter((_:any,idx:number)=> idx!==i); update(f.name,next);
                        }}>×</button>
                      </div>
                      {!deferUploads && pct !== undefined && pct < 100 && <div className="h-1 rounded bg-gray-200"><div className="h-1 rounded bg-blue-500" style={{width:`${pct}%`}}/></div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>;
    })}
  </div>;
};
