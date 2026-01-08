// app/components/destinations/destination-form.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { destinationService, type CreateDestinationRequest, type Destination } from '~/services/destination-service';

interface Props {
  destination?: Destination;
  mode: 'create' | 'edit';
}

export default function DestinationForm({ destination, mode }: Props) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(destination?.images || []);

  const [form, setForm] = useState<CreateDestinationRequest>({
    name: destination?.name || '',
    description: destination?.description || '',
    location: destination?.location || '',
    region: destination?.region || '',
    price_per_person: destination?.price_per_person || 0,
    duration_days: destination?.duration_days || 1,
    max_group_size: destination?.max_group_size || 10,
    featured: destination?.featured || false,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((p) => [...p, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const payload: CreateDestinationRequest = { ...form, images };
      let result: Destination;

      if (mode === 'create') {
        result = await destinationService.create(payload, user);
      } else {
        result = await destinationService.update(destination!.id, payload);
      }

      navigate(`/destinations/${result.id}`);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-uganda-black">
        {mode === 'create' ? 'Add New Destination' : 'Edit Destination'}
      </h2>

      {/* Basic Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        />
        <input
          required
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        />
        <input
          required
          placeholder="Region"
          value={form.region}
          onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        />
        <input
          required
          type="number"
          placeholder="Price per person"
          value={form.price_per_person}
          onChange={(e) => setForm((f) => ({ ...f, price_per_person: Number(e.target.value) }))}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        />
        <input
          required
          type="number"
          placeholder="Duration (days)"
          value={form.duration_days}
          onChange={(e) => setForm((f) => ({ ...f, duration_days: Number(e.target.value) }))}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        />
        <input
          required
          type="number"
          placeholder="Max group size"
          value={form.max_group_size}
          onChange={(e) => setForm((f) => ({ ...f, max_group_size: Number(e.target.value) }))}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        />
      </div>

      <textarea
        required
        rows={4}
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
      />

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            className="w-4 h-4 text-uganda-yellow rounded"
          />
          <span>Mark as Featured</span>
        </label>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block font-medium mb-2">Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-uganda-yellow file:text-uganda-black hover:file:bg-yellow-400"
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt={`preview ${i}`} className="h-24 w-full object-cover rounded" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-uganda disabled:opacity-50"
      >
        {loading ? 'Saving...' : mode === 'create' ? 'Create Destination' : 'Update Destination'}
      </button>
    </form>
  );
}