"use client";

import "./controls.css";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bath, BedDouble, ChevronDown, Heart, Home, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { collectionDescriptions, formatPrice, listings as mockListings } from "@/lib/gh-listings";

const collections = Object.keys(collectionDescriptions);

export default function HomesPage() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All areas");
  const [type, setType] = useState("All homes");
  const [beds, setBeds] = useState("Any beds");
  const [sort, setSort] = useState("Recommended");
  const [collection, setCollection] = useState("All homes");

  const areas = ["All areas", ...Array.from(new Set(mockListings.map((item) => item.area))).sort()];
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = mockListings.filter((item) =>
      (!q || `${item.title} ${item.address} ${item.area} ${item.postcode}`.toLowerCase().includes(q)) &&
      (area === "All areas" || item.area === area) &&
      (type === "All homes" || item.type === type) &&
      (beds === "Any beds" || item.bedrooms >= Number(beds[0])) &&
      (collection === "All homes" || item.collection.includes(collection))
    );
    return [...filtered].sort((a, b) => sort === "Price: low to high" ? a.price - b.price : sort === "Price: high to low" ? b.price - a.price : a.status === "New" ? -1 : b.status === "New" ? 1 : 0);
  }, [query, area, type, beds, sort, collection]);

  return <main className="homes-page">
    <header className="catalogue-header">
      <Link className="catalogue-brand" href="/"><span>L</span>listwise.</Link>
      <nav><Link className="active" href="/homes">Buy</Link><Link href="/">Sell</Link><Link href="/apply">Applications</Link></nav>
      <button className="saved-button" aria-label="Saved homes"><Heart/> <span>Saved</span></button>
    </header>

    <section className="search-intro">
      <p className="eyebrow">Greater Manchester</p>
      <h1>Find a home that fits your life.</h1>
      <form className="catalogue-search" onSubmit={(event) => event.preventDefault()}>
        <Search/>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search area, postcode or street" aria-label="Search homes" />
        <button type="submit">Search</button>
      </form>
      <p className="demo-notice">Listing facts sourced from Gascoigne Halman. Representative photography is used in this prototype; confirm availability and particulars with the agent.</p>
    </section>

    <section className="collection-strip" aria-label="Curated collections">
      {collections.map((name, index) => <button key={name} className={collection === name ? "active" : ""} onClick={() => setCollection(collection === name ? "All homes" : name)}>
        <span>0{index + 1}</span><strong>{name}</strong><small>{collectionDescriptions[name]}</small>
      </button>)}
    </section>

    <section className="catalogue-body">
      <div className="filter-row">
        <div className="filter-label"><SlidersHorizontal/>Filters</div>
        <label>Area<select value={area} onChange={(event) => setArea(event.target.value)}>{areas.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown/></label>
        <label>Property<select value={type} onChange={(event) => setType(event.target.value)}>{["All homes","Apartment","Terrace","Semi-detached","Detached"].map((value) => <option key={value}>{value}</option>)}</select><ChevronDown/></label>
        <label>Bedrooms<select value={beds} onChange={(event) => setBeds(event.target.value)}>{["Any beds","2+ beds","3+ beds","4+ beds"].map((value) => <option key={value}>{value}</option>)}</select><ChevronDown/></label>
        <label className="sort-select">Sort<select value={sort} onChange={(event) => setSort(event.target.value)}>{["Recommended","Price: low to high","Price: high to low"].map((value) => <option key={value}>{value}</option>)}</select><ChevronDown/></label>
      </div>
      <div className="results-heading"><div><h2>{results.length} homes</h2><p>{collection === "All homes" ? "Across Greater Manchester" : collectionDescriptions[collection]}</p></div><span>Updated today</span></div>
      {results.length ? <div className="property-grid">{results.map((item) => <article className="property-card" key={item.slug}>
        <Link className="property-image" href={`/homes/${item.slug}`}><img src={item.image} alt={`${item.type} in ${item.area}`} /><span className={`status ${item.status === "New" ? "new" : ""}`}>{item.status}</span><button aria-label={`Save ${item.title}`} onClick={(event) => event.preventDefault()}><Heart/></button></Link>
        <div className="property-copy"><div className="property-location"><MapPin/>{item.area}, {item.postcode}</div><Link href={`/homes/${item.slug}`}><h3>{item.title}</h3></Link><p>{item.address}</p><div className="property-facts"><span><BedDouble/>{item.bedrooms}</span><span><Bath/>{item.bathrooms}</span><span><Home/>{item.type}</span></div><div className="property-price"><small>{item.qualifier}</small><strong>{formatPrice(item.price)}</strong></div></div>
      </article>)}</div> : <div className="empty-results"><Search/><h3>No exact matches</h3><p>Try another area or loosen one of the filters.</p><button onClick={() => {setQuery("");setArea("All areas");setType("All homes");setBeds("Any beds");setCollection("All homes");}}>Clear filters</button></div>}
    </section>
  </main>;
}
