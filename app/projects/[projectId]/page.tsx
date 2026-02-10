'use client';

import { useState, useEffect, use } from 'react';
import { Project } from '@/types/projects';
import { Eye, Heart, MessageSquare, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchProject();
    }
  }, [status, resolvedParams.projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${resolvedParams.projectId}?trackView=true`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else if (response.status === 404) {
        router.push('/projects');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/projects/${resolvedParams.projectId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        // Refresh project to get updated stats
        fetchProject();
      }
    } catch (error) {
      console.error('Error liking project:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Project not found</p>
          <Link href="/projects" className="text-blue-600 hover:underline">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = session?.user && (session.user as any).id === project.authorId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      {project.bannerImage && (
        <div className="relative w-full h-64 md:h-96 bg-gray-200">
          <Image
            src={project.bannerImage}
            alt={project.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 mb-4">{project.description}</p>

              {/* Author */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                  {project.author?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-sm font-medium">{project.author?.name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 text-sm border rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isAuthor && (
              <Link
                href={`/projects/edit/${project.id}`}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            )}
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-gray-600">
              <Eye className="w-5 h-5" />
              <span>{project.stats.views} views</span>
            </div>
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 ${
                liked ? 'text-red-600' : 'text-gray-600'
              } hover:text-red-600 transition-colors`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{project.stats.likes} likes</span>
            </button>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare className="w-5 h-5" />
              <span>{project.stats.comments} comments</span>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {project.sections && project.sections.length > 0 ? (
            project.sections.map((section, idx) => (
              <div key={section.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                </div>
                <div className="prose max-w-none mb-4">
                  <p className="whitespace-pre-wrap">{section.content}</p>
                </div>

                {/* Media */}
                {section.media && section.media.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.media.map((media, mediaIdx) => (
                      <div key={mediaIdx} className="relative">
                        {media.type === 'image' && (
                          <div className="relative w-full h-64">
                            <Image
                              src={media.url}
                              alt={media.caption || ''}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        {media.type === 'video-embed' && (
                          <div className="relative w-full pt-[56.25%]">
                            <iframe
                              src={media.url}
                              className="absolute top-0 left-0 w-full h-full rounded"
                              sandbox="allow-scripts allow-same-origin allow-presentation"
                              allowFullScreen
                            />
                          </div>
                        )}
                        {media.caption && (
                          <p className="text-sm text-gray-600 mt-2">{media.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm text-center text-gray-600">
              No sections added yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
