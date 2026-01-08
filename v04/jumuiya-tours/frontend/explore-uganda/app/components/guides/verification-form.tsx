// app/components/guides/verification-form.tsx
import { useState } from 'react';
import { guideService } from '../../services/guide.service';
import { authService } from '../../services/auth.service';

interface Props {
  guideId: number;
  onSuccess?: () => void;
}

export default function VerificationForm({ guideId, onSuccess }: Props) {
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments((prev) => [...prev, ...files]);
  };

  const removeFile = (idx: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (documents.length === 0) {
      setMessage({ type: 'error', text: 'Please upload at least one document.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      await guideService.submitVerification(guideId, documents);
      setMessage({ type: 'success', text: 'Verification submitted! We’ll review it within 48 hours.' });
      setDocuments([]);
      onSuccess?.();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-uganda-black">Submit Verification</h3>
      <p className="text-sm text-gray-600">
        Upload government ID, guide license, or certification (PDF, JPG, PNG).
      </p>

      <input
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-uganda-yellow file:text-uganda-black hover:file:bg-yellow-400"
      />

      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected files:</p>
          {documents.map((file, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || documents.length === 0}
        className="w-full btn-uganda disabled:opacity-50"
      >
        {uploading ? 'Submitting...' : 'Submit for Verification'}
      </button>
    </form>
  );
}