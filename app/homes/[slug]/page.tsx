import { notFound } from "next/navigation";
import { listings as mockListings } from "@/lib/gh-listings";
import { CollectionPropertyPage } from "@/components/collection-property-page";

export function generateStaticParams() { return mockListings.map(({ slug }) => ({ slug })); }

export default async function MockHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const home = mockListings.find((item) => item.slug === slug);
  if (!home) notFound();
  return <CollectionPropertyPage home={home}/>;
}
