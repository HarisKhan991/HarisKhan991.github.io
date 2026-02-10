'use client';

import { Project } from '@/types/projects';
import { Eye, Heart, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border rounded-lg bg-white">
        {/* Thumbnail */}
        <div className="relative w-full aspect-[4/3] bg-gray-200 overflow-hidden">
          {project.thumbnailImage ? (
            <Image
              src={project.thumbnailImage}
              alt={project.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-white text-4xl font-bold">
                {project.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">
              {project.name}
            </h3>
            {project.status === 'draft' && (
              <span className="px-2 py-1 text-xs bg-gray-200 rounded">Draft</span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {project.description}
          </p>

          {/* Author */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
              {project.author?.name?.charAt(0) || 'A'}
            </div>
            <span className="text-sm text-gray-600">
              {project.author?.name || 'Anonymous'}
            </span>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {project.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-2 py-1 text-xs border rounded">
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="px-2 py-1 text-xs border rounded">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-3">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{project.stats.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{project.stats.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{project.stats.comments}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
