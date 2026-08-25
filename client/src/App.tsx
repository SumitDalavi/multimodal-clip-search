import { useState, useCallback } from 'react';
import axios from 'axios';
import { Search, Upload, Image, Sparkles, Loader2 } from 'lucide-react';

const API = 'http://localhost:4004';

interface SearchResult {
  id: string;
  filename: string;
  url: string;
  score: number;
  indexedAt: string;
}

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [indexedCount, setIndexedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await axios.post(`${API}/api/search`, { query, topK: 12 });
      setResults(res.data.results);
    } catch (err: any) {
      alert('Search failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSearching(false);
    }
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await axios.post(`${API}/api/index`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setIndexedCount(res.data.storeSize);
      }
      alert(`Successfully indexed ${files.length} image(s)!`);
    } catch (err: any) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const seedSampleImages = async () => {
    setUploading(true);
    const samples = [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/YellowLabradorLooking_new.jpg/1200px-YellowLabradorLooking_new.jpg', name: 'Golden Labrador Dog' },
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/1200px-Image_created_with_a_mobile_phone.png', name: 'Sunset Landscape' },
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png', name: 'Dice on transparent background' },
    ];
    try {
      for (const s of samples) {
        const res = await axios.post(`${API}/api/index-url`, s);
        setIndexedCount(res.data.storeSize);
      }
      alert('Seeded 3 sample images from Wikipedia!');
    } catch (err: any) {
      alert('Seeding failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2 rounded-xl">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CLIP Search</h1>
              <p className="text-slate-400 text-sm">Multimodal Image Search powered by CLIP-ViT-B/32</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              <Image className="w-4 h-4 inline mr-1" />
              {indexedCount} images indexed
            </span>
            <button
              onClick={seedSampleImages}
              disabled={uploading}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
              Seed Sample Images
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder='Search with natural language... (e.g. "a yellow dog looking at the camera")'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-6 py-4 pr-14 text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-500 p-2.5 rounded-xl transition-colors"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {/* Upload Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-violet-400 bg-violet-500/10' : 'border-slate-600 hover:border-slate-500'
          }`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) handleFileUpload(files);
            };
            input.click();
          }}
        >
          <Upload className="w-10 h-10 mx-auto text-slate-500 mb-3" />
          <p className="text-slate-400 text-sm">
            <span className="font-semibold text-slate-300">Drop images here</span> or click to upload
          </p>
          <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP up to 10MB</p>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-slate-300">
              Results for &ldquo;{query}&rdquo;
            </h2>
            <div className="masonry-grid">
              {results.map((r) => (
                <div key={r.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:shadow-violet-500/10 transition-shadow group">
                  <div className="relative overflow-hidden">
                    <img
                      src={`${API}${r.url}`}
                      alt={r.filename}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-xs px-2.5 py-1 rounded-full font-mono">
                      {(r.score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-slate-300 truncate font-medium">{r.filename}</p>
                    <p className="text-xs text-slate-500 mt-1">Similarity: {r.score.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && !searching && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 text-lg">Upload some images, then search with natural language</p>
            <p className="text-slate-600 text-sm mt-2">Try queries like "a photo of a sunset" or "a cute animal"</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
