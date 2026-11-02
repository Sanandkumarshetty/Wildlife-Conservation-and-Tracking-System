// 'use client';

// import { useState } from 'react';
// import { getSpeciesImageUrl, SPECIES_IMAGE_FALLBACK } from '../utils/speciesImages';

// export default function SpeciesImage({ species, className, loading = 'lazy' }) {
//   const imageUrl = getSpeciesImageUrl(species);
//   const [failedImageUrl, setFailedImageUrl] = useState(null);
//   const scientificName = species?.scientific_name || species?.scientificName;
//   const alt = species?.common_name || species?.commonName || scientificName || 'Wildlife species';

//   return (
//     <img
//       className={className}
//       src={failedImageUrl === imageUrl ? SPECIES_IMAGE_FALLBACK : imageUrl}
//       alt={alt}
//       loading={loading}
//       onError={() => setFailedImageUrl(imageUrl)}
//     />
//   );
// }
