import { cn } from '@/lib/utils';

export default function Container({ children, className, as: Tag = 'div', ...props }) {
  return (
    <Tag className={cn('container max-w-7xl 2xl:max-w-screen-2xl', className)} {...props}>
      {children}
    </Tag>
  );
}
