'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, Download } from 'lucide-react';

export default function AIImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [csvData, setCsvData] = useState('');
  const [parsing, setParsing] = useState(false);
  const [sections, setSections] = useState<any[]>([]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleParse = async () => {
    setParsing(true);
    try {
      const response = await fetch('/api/projects/csv-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvData }),
      });

      if (response.ok) {
        const data = await response.json();
        setSections(data.sections);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to parse CSV');
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Failed to parse CSV');
    } finally {
      setParsing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/projects/csv-parse');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project-template.csv';
        a.click();
      }
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Import from CSV</h1>
        <p className="text-gray-600 mb-8">
          Use AI to generate project documentation from YouTube videos or websites, then import the CSV here.
        </p>

        {/* AI Prompt Template */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">AI Prompt Template</h2>
          <div className="bg-gray-100 p-4 rounded-lg mb-4 text-sm">
            <pre className="whitespace-pre-wrap font-mono">
{`You are an AI assistant helping students create project documentation in Instructables style.

[INPUT: Paste YouTube video URL OR website URL OR project description here]

Generate a CSV file with this EXACT structure:
section_order,section_title,section_content,image_url_1,image_url_2,image_url_3,video_url,video_type

Rules:
- Create 5-10 logical step-by-step sections
- Extract relevant images from the source (provide URLs)
- For YouTube videos: extract thumbnail, video ID, chapters if available
- Include "Introduction" and "Conclusion" sections
- Format section_content as plain text (escape quotes)
- image_url fields can be empty if no images
- video_url should be YouTube embed URL format
- video_type should be: youtube, vimeo, or local

Example CSV output:
section_order,section_title,section_content,image_url_1,image_url_2,image_url_3,video_url,video_type
1,Introduction,"This project demonstrates how to build a smart home system.",https://example.com/img1.jpg,,,https://youtube.com/embed/abc123,youtube
2,Materials Needed,"Gather components: Arduino, sensors, LEDs.",https://example.com/img2.jpg,,,,`}
            </pre>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </button>
        </div>

        {/* CSV Input */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Paste Your CSV</h2>
          <textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={10}
            placeholder="Paste your CSV data here..."
          />
          <button
            onClick={handleParse}
            disabled={!csvData || parsing}
            className="mt-4 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FileText className="w-5 h-5" />
            {parsing ? 'Parsing...' : 'Parse CSV'}
          </button>
        </div>

        {/* Parsed Sections Preview */}
        {sections.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              Parsed Sections ({sections.length})
            </h2>
            <div className="space-y-4 mb-6">
              {sections.map((section, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">
                    {idx + 1}. {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {section.content.substring(0, 100)}...
                  </p>
                  {section.media && section.media.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {section.media.length} media items
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  // Store sections in localStorage and redirect to create page
                  localStorage.setItem('importedSections', JSON.stringify(sections));
                  router.push('/projects/create');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue to Editor
              </button>
              <button
                onClick={() => setSections([])}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
