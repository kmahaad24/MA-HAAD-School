import Image from 'next/image';
import { SHIMMER } from '@/lib/image';

// next/image with a shimmer placeholder. Renders nothing when there is no src (e.g. a photo not uploaded yet),
// so pages never show a broken image.
//   <SmartImage src={item.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
export default function SmartImage({ src, alt = '', ...props }) {
  if (!src) return null;
  return <Image src={src} alt={alt} placeholder={SHIMMER} {...props} />;
}
