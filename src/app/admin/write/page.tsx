/**
 * Write Post Page
 * Create new posts with Chyrp-Lite feather support
 */

"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FeatherDynamicFields } from '@/src/components/admin/FeatherDynamicFields';
import AdminLayout from "../../../components/admin/AdminLayout";
import { canCreateContent } from "../../../lib/auth/adminAccess";
import { useAuth } from "../../../lib/auth/session";

interface PostFormData {
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  featherName: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  publishedAt?: string;
  tags: string[];
  categories: string[];
}

interface FeatherInfo { slug:string; name:string; description?:string; fields: any[] }
// dynamic feathers


const WritePage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    body: '',
    excerpt: '',
    featherName: 'text',
    status: 'DRAFT',
    tags: [],
    categories: [],
  });
  const [feathers,setFeathers] = useState<FeatherInfo[]>([]);
  const [featherData,setFeatherData] = useState<any>({});

  useEffect(()=>{
    fetch('/api/feathers').then(r=>r.ok?r.json():null).then(d=>{
      const feathersArr = d?.feathers || d?.data?.feathers || [];
      if (feathersArr.length) {
        setFeathers(feathersArr);
        if (!formData.featherName) setFormData(f=>({...f, featherName: feathersArr[0].slug}));
      }
    });
    // only run once or when featherName cleared intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[/* intentional single run */]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user && !canCreateContent(user)) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  // Helper to materialize deferred (client-staged) files into real asset uploads sequentially.
  async function flushDeferredFiles(): Promise<any> {
    if (!featherData) return {};
    const clone = { ...featherData };
    const uploadOne = (file: File) => new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/assets/upload');
      xhr.onload = () => {
        if (xhr.status >=200 && xhr.status <300) {
          try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(e); }
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      const fd = new FormData();
      fd.append('file', file);
      xhr.send(fd);
    });

    const processField = async (key: string, val: any) => {
      if (!val) return;
      // Single media placeholder
      if (val && val._file instanceof File) {
        const result = await uploadOne(val._file);
        if (!result?.data?.url) throw new Error('Upload result missing URL');
        clone[key] = result.data.url;
      } else if (Array.isArray(val)) {
        const newArr: any[] = [];
        for (const item of val) {
          if (item && item._file instanceof File) {
            const result = await uploadOne(item._file);
            if (!result?.data?.url) throw new Error('Upload result missing URL');
            newArr.push({
              url: result.data.url,
              name: item.name,
              size: item.size,
              type: item.type,
              thumbnail: result.data.thumbnailUrl || undefined
            });
          } else {
            newArr.push(item);
          }
        }
        clone[key] = newArr;
      }
    };

    for (const k of Object.keys(clone)) {
      // eslint-disable-next-line no-await-in-loop
      await processField(k, clone[k]);
    }
    return clone;
  }

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    setSaving(true);
    try {
    // First, flush any deferred uploads
    const resolvedFeatherData = await flushDeferredFiles();
    // Ensure slug present
    const finalSlug = formData.slug || generateSlug(formData.title);
    const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          slug: finalSlug,
          visibility: status, // API expects visibility
          publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : undefined,
      feather: formData.featherName.toUpperCase(),
      featherData: resolvedFeatherData,
        }),
      });

      const data = await response.json().catch(()=>null);
      if (response.ok && data?.post?.id) {
        router.push(`/admin/manage/posts/${data.post.id}`);
      } else {
        const msg = data?.message || data?.error || 'Failed to save post';
        alert(msg);
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      alert('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Loading session...</div>;
  }

  // Access gate with visible message instead of bare null (prevents blank page confusion)
  const hasAccess = !!user && canCreateContent(user);
  if (!loading && !hasAccess) {
    return <div className="p-8 text-sm text-red-600">You do not have permission to create posts. (role: {user?.role || 'none'})</div>;
  }

  return (
    <AdminLayout title="Write New Post">
      <div className="max-w-4xl">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Write New Post</h1>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleSubmit('DRAFT')}
                disabled={saving || !formData.title}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={saving || !formData.title}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter post title..."
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="url-slug"
                />
                <p className="mt-1 text-sm text-gray-500">
                  The URL-friendly version of the title. Leave blank to auto-generate.
                </p>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  id="body"
                  rows={16}
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start writing your post..."
                />
              </div>
              {/* Feather Specific Fields */}
              {feathers.filter(f=> (f as any).slug === formData.featherName).map(f=> <div key={(f as any).slug} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">{(f as any).name} Options</h3>
                <FeatherDynamicFields deferUploads fields={(f as any).fields||[]} value={featherData} onChange={setFeatherData} />
              </div>)}

              {/* Excerpt */}
              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt (Optional)
                </label>
                <textarea
                  id="excerpt"
                  rows={3}
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary or excerpt..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  A short summary that appears in post listings. Leave blank to auto-generate from content.
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Post Type (Feather) */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Post Type</h3>
                <div className="space-y-2">
                  {(feathers.length?feathers:[]).map((feather) => (
                    <label key={(feather as any).slug} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="feather"
        value={(feather as any).slug || (feather as any).id}
        checked={formData.featherName === ((feather as any).slug || (feather as any).id)}
        onChange={(e) => setFormData(prev => ({ ...prev, featherName: e.target.value }))}
                        className="mt-1 focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <div>
        <div className="text-sm font-medium text-gray-900">{(feather as any).name}</div>
        <div className="text-sm text-gray-500">{(feather as any).description}</div>
                      </div>
                    </label>
                  ))}
      {feathers.length===0 && <div className="text-xs text-gray-500">Loading feather types...</div>}
                </div>
              </div>

              {/* Status */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Status</h3>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>

              {/* Tags */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                <input
                  type="text"
                  placeholder="Add tags separated by commas"
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                    setFormData(prev => ({ ...prev, tags }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separate tags with commas
                </p>
              </div>

              {/* Categories */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Categories</h3>
                <input
                  type="text"
                  placeholder="Add categories separated by commas"
                  onChange={(e) => {
                    const categories = e.target.value.split(',').map(cat => cat.trim()).filter(Boolean);
                    setFormData(prev => ({ ...prev, categories }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separate categories with commas
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default WritePage;
