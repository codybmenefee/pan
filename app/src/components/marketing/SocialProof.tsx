const testimonials = [
  {
    quote: "This matches how I think about my land.",
    author: "Montana rancher",
    detail: "2,400 acre operation",
  },
  {
    quote: "Finally, data that actually helps me make decisions instead of just more numbers to look at.",
    author: "Texas rancher",
    detail: "Multi-pasture rotational grazing",
  },
  {
    quote: "The daily brief saves me 30 minutes every morning I used to spend walking pastures.",
    author: "Kentucky dairy farmer",
    detail: "45 pasture system",
  },
]

const stats = [
  { value: '15,000+', label: 'Acres managed' },
  { value: '94%', label: 'Recommendation accuracy' },
  { value: '2.5x', label: 'Faster decisions' },
]

export function SocialProof() {
  return (
    <section className="py-16 md:py-24 bg-[#111719]" aria-labelledby="social-proof-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2
              id="social-proof-heading"
              className="text-2xl md:text-3xl font-bold text-[#FDF6E3] text-balance"
            >
              Built With Farmers Who Believe Pastured Can Win
            </h2>
            <p className="text-base text-[#D3DBDD] max-w-2xl mx-auto">
              Decision support that matches how you think about your land
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#F4D47C]">{stat.value}</div>
                <div className="text-sm text-[#D3DBDD] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <figure
                key={index}
                className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-6 hover:border-[#075056]/50 transition-colors"
              >
                <blockquote>
                  <p className="text-base italic text-[#FDF6E3]/90 mb-4">
                    "{testimonial.quote}"
                  </p>
                </blockquote>
                <figcaption>
                  <div className="text-sm font-medium text-[#FDF6E3]">{testimonial.author}</div>
                  <div className="text-xs text-[#D3DBDD]/70 mt-0.5">{testimonial.detail}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
