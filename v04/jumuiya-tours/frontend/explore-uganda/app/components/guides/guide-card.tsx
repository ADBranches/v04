// app/components/guides/guide-card.tsx
import { Link } from 'react-router-dom';
import type { Guide } from '../../services/guide.types';
import { StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

interface Props {
  guide: Guide;
}

export default function GuideCard({ guide }: Props) {
  if (!guide || !guide.user) return null; 
  
  const avatar = guide.user?.avatar || '/avatar-placeholder.jpg';
  const isVerified = guide.verification_status === 'verified';

  return (
    <Link
      to={`/guides/${guide.id}`}
      className="group block rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 card-uganda"
    >
      <div className="flex items-center p-4">
        <img
          src={avatar}
          alt={guide.user?.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-uganda-yellow"
        />
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-uganda-black group-hover:text-uganda-red transition-colors">
              {guide.user?.name}
            </h3>
            {isVerified && (
              <CheckBadgeIcon className="w-6 h-6 text-uganda-yellow" title="Verified Guide" />
            )}
          </div>
          <p className="text-sm text-gray-600">{guide.experience_years} years experience</p>

          <div className="flex items-center mt-2">
            <div className="flex text-uganda-yellow">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(guide.rating) ? 'fill-current' : 'fill-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-1 text-sm text-gray-600">
              {guide.rating} ({guide.review_count})
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {guide.specialties.slice(0, 2).map((s) => (
              <span
                key={s}
                className="text-xs bg-uganda-yellow text-uganda-black px-2 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
            {guide.specialties.length > 2 && (
              <span className="text-xs text-gray-600">+{guide.specialties.length - 2} more</span>
            )}
          </div>

          <p className="mt-2 text-lg font-bold text-uganda-red">
            ${guide.hourly_rate}/hr
          </p>
        </div>
      </div>
    </Link>
  );
}