import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ResilientImage from '../components/ResilientImage';
import { JournalArticle } from '../data/journal';
import { useSiteData } from '../contexts/SiteDataContext';

export default function BlogPage() {
  const { journal } = useSiteData();
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);

  if (selectedArticle) {
    return (
      <div className="py-12 lg:py-16">
        <article className="max-w-[820px] mx-auto px-4 sm:px-6 space-y-8">
          <button
            type="button"
            onClick={() => setSelectedArticle(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#194793] hover:text-[#133672] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Field Journal</span>
          </button>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
              <span className="font-semibold text-[#C8231D]">{selectedArticle.category}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedArticle.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedArticle.readTime}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-[#111827]">
              {selectedArticle.title}
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#4B5563]">
              {selectedArticle.excerpt}
            </p>
          </div>

          <div className="aspect-[16/9] rounded-lg overflow-hidden border border-[#111827]/10 bg-[#E5EBF4]">
            <ResilientImage
              src={selectedArticle.image}
              alt={selectedArticle.title}
              className="w-full h-full object-cover"
              fallbackLabel={selectedArticle.title}
            />
          </div>

          <div className="space-y-8 pt-2">
            {selectedArticle.sections.map((section) => (
              <section key={section.heading} className="space-y-2.5">
                <h2 className="font-serif text-2xl text-[#111827]">{section.heading}</h2>
                <p className="text-base leading-relaxed text-[#4B5563]">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="pt-8 border-t border-[#111827]/10 flex flex-wrap items-center justify-between gap-4">
            <Link
              to={`/destinations#${selectedArticle.recommendedRouteSlug}`}
              className="text-sm font-semibold text-[#194793] hover:underline"
            >
              View matching regional route guide →
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672] transition-colors"
            >
              <span>Book a Vehicle for This Trip</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">Field journal</p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-[#111827]">
            Route notes & dispatches from Western Kenya.
          </h1>
          <p className="text-base leading-relaxed text-[#4B5563]">
            Practical travel guidance, rainy-season road readiness, and airport arrival tips from
            the Kechas Agencies dispatch desk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {journal.map((article) => (
            <article
              key={article.slug}
              className="flex flex-col justify-between rounded-lg border border-[#111827]/10 bg-white overflow-hidden"
            >
              <div>
                <div className="aspect-[16/10] overflow-hidden bg-[#E5EBF4]">
                  <ResilientImage
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    fallbackLabel={article.title}
                  />
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
                    <span className="font-semibold text-[#C8231D]">{article.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h2 className="font-serif text-2xl leading-snug text-[#111827]">
                    {article.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#4B5563]">{article.excerpt}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#111827]/10 bg-[#F9FAFB]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArticle(article);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#194793] hover:text-[#133672] transition-colors"
                >
                  <span>Read Dispatch Note</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
