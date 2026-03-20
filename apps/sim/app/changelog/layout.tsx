import { martianMono } from '@/app/_styles/fonts/martian-mono/martian-mono'
import Footer from '@/app/(home)/components/footer/footer'
import Navbar from '@/app/(home)/components/navbar/navbar'

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${martianMono.variable} relative min-h-screen bg-[var(--text-primary)] font-[430] font-season text-[var(--landing-text)]`}
    >
      <header>
        <Navbar />
      </header>
      {children}
      <Footer hideCTA />
    </div>
  )
}
