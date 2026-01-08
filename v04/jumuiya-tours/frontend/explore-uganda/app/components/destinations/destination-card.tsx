// app/components/destinations/destination-card.tsx
import { Link } from 'react-router-dom';
import type {Destination} from '../../services/destination.types';
import { StarIcon } from '@heroicons/react/24/solid';

interface Props {
  destination: Destination;
}

export default function DestinationCard({ destination }: Props) {
  let primaryImage = '/placeholder.jpg';
  if (destination?.images) {
    primaryImage = destination.images[0];
  }

  return (
    <Link
      to={`/destinations/${destination.id}`}
      className="group block rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 card-uganda"
    >
      <div className="aspect-w-16 aspect-h-9 relative overflow-hidden">
        <img
          src={primaryImage}
          alt={destination.name}
          className="object-cover w-full h-56 group-hover:scale-105 transition-transform duration-300"
        />
        {destination.featured && (
          <span className="absolute top-2 right-2 bg-uganda-yellow text-uganda-black text-xs font-bold px-2 py-1 rounded">
            Featured
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-uganda-black group-hover:text-uganda-red transition-colors">
          {destination.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{destination.location}</p>

        <div className="flex items-center mt-2">
          <div className="flex text-uganda-yellow">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(destination.rating) ? 'fill-current' : 'fill-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-1 text-sm text-gray-600">
            {destination.rating} ({destination.review_count})
          </span>
        </div>

        <div className="mt-3 flex justify-between items-center">
          <p className="text-lg font-bold text-uganda-red">
            ${destination.price_per_person}
            <span className="text-sm font-normal text-gray-600"> / person</span>
          </p>
          <p className="text-sm text-gray-600">{destination.duration_days} days</p>
        </div>
      </div>
    </Link>
  );
}