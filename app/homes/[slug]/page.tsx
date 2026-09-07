import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, Check, Home, MapPin } from "lucide-react";
import { formatPrice, listings as mockListings } from "@/lib/gh-listings";
import { SalesTimeline } from "@/components/sales-timeline";

const marketPostcodes: Record<string, string> = {
  Didsbury: "M20 6RN",
  Hale: "WA15 9SF",
  Altrincham: "WA14 1EN",
  "Heaton Moor": "SK4 4HY",
};

export function generateStaticParams() { return mockListings.map(({ slug }) => ({ slug })); }

export default async function MockHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const home = mockListings.find((item) => item.slug === slug);
  if (!home) notFound();
  return <main className="mock-detail">
    <header className="catalogue-header"><Link className="catalogue-brand" href="/"><span>L</span>listwise.</Link><Link className="back-link" href="/homes"><ArrowLeft/>All homes</Link></header>
    <section className="mock-hero"><img src={home.image} alt={`${home.type} in ${home.area}`} /><div className="mock-hero-copy"><span className="status new">{home.status}</span><p><MapPin/>{home.area}, {home.postcode}</p><h1>{home.title}</h1><h2>{home.address}</h2><div className="mock-price"><small>{home.qualifier}</small><strong>{formatPrice(home.price)}</strong></div></div></section>
    <section className="mock-detail-grid"><article><div className="property-facts detail-facts"><span><BedDouble/>{home.bedrooms} bedrooms</span><span><Bath/>{home.bathrooms} bathrooms</span><span><Home/>{home.type}</span></div><h2>A home worth seeing properly.</h2><p>{home.description}</p><div className="mock-highlights"><span><Check/>Owner-prepared property pack</span><span><Check/>Viewing documents handled online</span><span><Check/>Local market context included</span></div><a href={home.sourceUrl} target="_blank" rel="noreferrer">View original Gascoigne Halman listing</a></article><aside><small>VIEWING APPLICATION</small><h3>Make your interest count.</h3><p>Choose a time, share your buying position and securely prepare the documents the seller needs.</p><Link href={`/apply?property=${home.slug}`}>Apply for a viewing</Link><em>Gascoigne Halman source · Representative photography</em></aside></section>
    <SalesTimeline postcode={marketPostcodes[home.area] ?? "M20 6RN"}/>
  </main>;
}
