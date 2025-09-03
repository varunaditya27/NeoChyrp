import Image from 'next/image';
import React from 'react';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';

import UploadForm from './UploadForm';


export const dynamic = 'force-dynamic';

// NOTE: This is a server component. Upload handled via a nested client component.

async function fetchAssets() {
  // For MVP we list most recent 50 assets (global) – future: restrict to current user.
  return prisma.asset.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
}

function bytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default async function AssetsPage() {
  const assets = await fetchAssets();
  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-6 text-2xl font-bold">Assets</h1>
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <UploadForm />
          </div>
          <div className="md:col-span-2">
            {assets.length === 0 ? (
              <p className="text-sm text-gray-500">No assets uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-600">Preview</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Type</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Size</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(a => (
                      <tr key={a.id} className="border-t last:border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {a.type === 'IMAGE' ? (
                            <Image src={a.url} alt="" width={48} height={48} className="size-12 rounded object-cover" />
                          ) : (
                            <span className="text-xs text-gray-500">{a.mimeType}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 capitalize">{a.type.toLowerCase()}</td>
                        <td className="px-4 py-2 text-gray-600">{bytes(a.size)}</td>
                        <td className="px-4 py-2 text-gray-500">{new Date(a.createdAt as unknown as string).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">Future: role based access, deletion, bulk operations, metadata extraction.</p>
      </Container>
    </div>
  );
}
