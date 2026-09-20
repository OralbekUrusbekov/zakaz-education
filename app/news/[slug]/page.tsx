import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, CalendarDays, Clock, User } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { NEWS, formatNewsDate, formatNewsDateShort, getNews, newsArt } from '@/lib/news'
import { T } from '@/components/site/t'

export const generateStaticParams = () => NEWS.map((n) => ({ slug: n.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const news = getNews((await params).slug)
  return news ? { title: `${news.title} — Tech School`, description: news.excerpt } : { title: 'Новость не найдена' }
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const news = getNews((await params).slug)
  if (!news) notFound()

  const others = NEWS.filter((n) => n.slug !== news.slug).slice(0, 3)

  return (
    <SiteShell>
      <article>
        <header className="article-hero">
          <div className="container-wide">
            <Link href="/news" className="article-back"><ArrowLeft size={15} />{<T>{'Все новости'}</T>}</Link>
            <p className="eyebrow"><T>{news.category}</T></p>
            <h1><T>{news.title}</T></h1>
            <div className="article-meta">
              <span><CalendarDays size={15} /> {formatNewsDate(news.date)}</span>
              <span><User size={15} /> <T>{news.author}</T></span>
              <span><Clock size={15} /> {news.readingMinutes} мин чтения</span>
            </div>
          </div>
        </header>

        <div className="container-wide article-cover">
          <img src={newsArt(news)} alt="" />
        </div>

        <div className="container-wide article-body">
          <p className="article-lead"><T>{news.excerpt}</T></p>
          {news.content.map((p, i) => <p key={i}><T>{p}</T></p>)}
        </div>

        <section className="container-wide article-more">
          <div className="section-heading">
            <h2>{<T>{'Другие новости'}</T>}</h2>
            <Link href="/news" className="text-link">{<T>{'Все новости'}</T>}<ArrowRight size={16} /></Link>
          </div>
          <div className="news-cards">
            {others.map((n) => (
              <Link key={n.slug} href={`/news/${n.slug}`} className="news-card">
                <span className="news-card-photo"><img src={newsArt(n)} alt="" /></span>
                <span className="news-card-body">
                  <span className="news-card-meta">
                    <span className="news-tag"><T>{n.category}</T></span>
                    <span className="news-date">{formatNewsDateShort(n.date)}</span>
                  </span>
                  <h2><T>{n.title}</T></h2>
                  <p><T>{n.excerpt}</T></p>
                  <span className="news-more">{<T>{'Читать'}</T>}<ArrowRight size={15} /></span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </SiteShell>
  )
}
