import Link from 'next/link'
import { cn } from '@/lib/core/utils/cn'

const FEATURED_POST = {
  title: 'Build with Sim for Enterprise',
  slug: 'enterprise',
  image: '/blog/thumbnails/enterprise.webp',
} as const

const POSTS = [
  { title: 'Introducing Sim v0.5', slug: 'v0-5', image: '/blog/thumbnails/v0-5.webp' },
  { title: '$7M Series A', slug: 'series-a', image: '/blog/thumbnails/series-a.webp' },
  {
    title: 'Realtime Collaboration',
    slug: 'multiplayer',
    image: '/blog/thumbnails/multiplayer.webp',
  },
  { title: 'Inside the Executor', slug: 'executor', image: '/blog/thumbnails/executor.webp' },
  { title: 'Inside Sim Copilot', slug: 'copilot', image: '/blog/thumbnails/copilot.webp' },
] as const

function BlogCard({
  slug,
  image,
  title,
  imageHeight,
  titleSize = '12px',
  className,
}: {
  slug: string
  image: string
  title: string
  imageHeight: string
  titleSize?: string
  className?: string
}) {
  return (
    <Link
      href={`/blog/${slug}`}
      className={cn(
        'group/card flex flex-col overflow-hidden rounded-[5px] border border-[var(--surface-4)] bg-[var(--text-primary)] transition-colors hover:border-[var(--border-1)] hover:bg-[var(--surface-4)]',
        className
      )}
      prefetch={false}
    >
      <div className='w-full overflow-hidden bg-[#141414]' style={{ height: imageHeight }}>
        <img
          src={image}
          alt={title}
          decoding='async'
          className='h-full w-full object-cover transition-transform duration-200 group-hover/card:scale-[1.02]'
        />
      </div>
      <div className='flex-shrink-0 px-2.5 py-1.5'>
        <span
          className='font-[430] font-season text-[var(--text-body)] leading-[140%]'
          style={{ fontSize: titleSize }}
        >
          {title}
        </span>
      </div>
    </Link>
  )
}

export function BlogDropdown() {
  return (
    <div className='w-[560px] rounded-[5px] border border-[var(--surface-4)] bg-[var(--text-primary)] p-4 shadow-overlay'>
      <div className='grid grid-cols-3 gap-2'>
        <BlogCard
          slug={FEATURED_POST.slug}
          image={FEATURED_POST.image}
          title={FEATURED_POST.title}
          imageHeight='190px'
          titleSize='13px'
          className='col-span-2 row-span-2'
        />

        {POSTS.slice(0, 2).map((post) => (
          <BlogCard
            key={post.slug}
            slug={post.slug}
            image={post.image}
            title={post.title}
            imageHeight='72px'
          />
        ))}

        {POSTS.slice(2).map((post) => (
          <BlogCard
            key={post.slug}
            slug={post.slug}
            image={post.image}
            title={post.title}
            imageHeight='72px'
          />
        ))}
      </div>
    </div>
  )
}
