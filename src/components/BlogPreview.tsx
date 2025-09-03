"use client";
import Image from 'next/image';
import React from "react";

import type { BlogPost } from "../types/blog";

const samplePosts: BlogPost[] = [
  {
    id: "1",
    title: "Welcome to NeoChyrp!",
    excerpt: "Discover a new era of blogging with modular features and blazing speed.",
    author: "Admin",
    date: "2025-09-01",
    image: "/images/sample1.jpg",
  },
  {
    id: "2",
    title: "Why Modular Matters",
    excerpt: "Learn how NeoChyrp’s modular design lets you build your perfect blog.",
    author: "Jane Doe",
    date: "2025-08-28",
    image: "/images/sample2.jpg",
  },
];

const BlogPreview: React.FC = () => (
  <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
    {samplePosts.map((post) => (
      <div key={post.id} className="flex flex-col rounded-lg bg-white p-4 shadow-md">
        {post.image && (
          <Image src={post.image} alt={post.title} width={600} height={160} className="mb-3 h-40 w-full rounded-md object-cover" />
        )}
        <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
        <p className="mb-2 text-gray-600">{post.excerpt}</p>
        <div className="text-xs text-gray-400">{post.author} • {post.date}</div>
      </div>
    ))}
  </div>
);

export default BlogPreview;
