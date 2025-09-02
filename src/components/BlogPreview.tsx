"use client";
import React from "react";
import { BlogPost } from "../types/blog";

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
  <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
    {samplePosts.map((post) => (
      <div key={post.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
        {post.image && (
          <img src={post.image} alt={post.title} className="w-full h-40 object-cover rounded-md mb-3" />
        )}
        <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
        <p className="text-gray-600 mb-2">{post.excerpt}</p>
        <div className="text-xs text-gray-400">{post.author} • {post.date}</div>
      </div>
    ))}
  </div>
);

export default BlogPreview;