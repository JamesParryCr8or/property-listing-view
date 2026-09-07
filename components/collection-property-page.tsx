"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Bath, BedDouble, Building2, Check, CircleCheck, ExternalLink, Heart, Home, MapPin, Share2, TrainFront, Trees } from "lucide-react";
import type { Listing } from "@/lib/gh-listings";
import { formatPrice } from "@/lib/gh-listings";
import { NearbySalesMap, type NearbySale } from "@/components/nearby-sales-map";
import { SalesTimeline } from "@/components/sales-timeline";

type Market = { postcode:string; center:{lat:number;lng:number}; local:string };
const markets:Record<string,Market>={
  Didsbury:{postcode:"M20 6RN",center:{lat:53.4154,lng:-2.2314},local:"Didsbury Village"},
  Hale:{postcode:"WA15 9SF",center:{lat:53.3780,lng:-2.3470},local:"Hale Village"},
  Altrincham:{postcode:"WA14 1EN",center:{lat:53.3875,lng:-2.3485},local:"Altrincham town centre"},
  "Heaton Moor":{postcode:"SK4 4HY",center:{lat:53.4225,lng:-2.1850},local:"Heaton Moor village"},
};

const offsets=[[.0022,-.0028],[-.0018,.0025],[.0031,.0017],[-.0029,-.0014],[.0011,.0035]] as const;
function marketSales(home:Listing,market:Market):NearbySale[]{const multipliers=[.92,1.04,.86,1.12,.98];return offsets.map(([lat,lng],index)=>({id:`${home.slug}-${index}`,label:`Nearby ${home.type.toLowerCase()}`,price:Math.round(home.price*multipliers[index]/5000)*5000,year:2025-index%4,distance:["180m","310m","420m","560m","740m"][index],lat:market.center.lat+lat,lng:market.center.lng+lng}))}

export function CollectionPropertyPage({home}:{home:Listing}){
  const [saved,setSaved]=useState(false);const [copied,setCopied]=useState(false);const [radius,setRadius]=useState("500m");
  const market=markets[home.area]??markets.Didsbury;
  const sales=useMemo(()=>{const limit=radius==="200m"?1:radius==="500m"?3:5;return marketSales(home,market).slice(0,limit)},[home,market,radius]);
  function share(){navigator.clipboard?.writeText(window.location.href);setCopied(true);window.setTimeout(()=>setCopied(false),1600)}
  return <main className="collection-product">
    <header className="catalogue-header"><Link className="catalogue-brand" href="/"><span>L</span>listwise.</Link><nav><Link href="/homes"><ArrowLeft/> All homes</Link><Link href="/portal">My workspace</Link></nav><button className="saved-button" onClick={()=>setSaved(!saved)} aria-label={saved?"Remove saved home":"Save home"}><Heart fill={saved?"currentColor":"none"}/><span>{saved?"Saved":"Save"}</span></button></header>
    <section className="hero-gallery collection-hero"><img className="hero-image" src={home.image} alt={`${home.type} in ${home.area}`}/><div className="hero-shade"/><div className="gallery-top"><span className="verified"><CircleCheck/> Listing details sourced</span><button onClick={()=>setSaved(!saved)} aria-label="Save property" className={saved?"liked":""}><Heart fill={saved?"currentColor":"none"}/></button></div><div className="hero-copy"><p>{home.status} · {home.area}, Greater Manchester</p><h1>{home.title}</h1><p className="hero-line">{home.description}</p><div className="hero-facts"><span><BedDouble/>{home.bedrooms} bedrooms</span><span><Bath/>{home.bathrooms} bathrooms</span><span><Home/>{home.type}</span></div></div><a className="gallery-button" href={home.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink/> Original listing</a></section>
    <div className="listing-shell"><section className="listing-main">
      <section className="owner-note particulars-note"><div className="quote-mark">“</div><div><p className="eyebrow">From the particulars</p><blockquote>{home.description}</blockquote><p>Listing information supplied by Gascoigne Halman</p></div></section>
      <section className="story-section"><p className="eyebrow">The home</p><h2>Space for the way you want to live.</h2><p>This {home.bedrooms}-bedroom {home.type.toLowerCase()} places you close to {market.local}, with the buying journey, viewing documents and conversations managed through one Listwise workspace.</p><div className="feature-grid"><span><BedDouble/>{home.bedrooms} bedrooms</span><span><Bath/>{home.bathrooms} bathrooms</span><span><Building2/>{home.type}</span><span><MapPin/>{home.area}</span></div></section>
      <section className="market-section"><p className="eyebrow">Local market lens</p><div className="section-heading"><div><h2>Explore the nearby market</h2><p>Interactive Google map · illustrative marker positions around {market.postcode}</p></div><div className="radius-switch">{["200m","500m","1 mile"].map(value=><button key={value} onClick={()=>setRadius(value)} className={radius===value?"active":""}>{value}</button>)}</div></div><NearbySalesMap sales={sales} center={market.center} homeLabel={home.title}/></section>
      <section className="location-section"><p className="eyebrow">Around the home</p><h2>Connected to the neighbourhood.</h2><div className="location-cards"><article><b>{market.local}</b><span>Local shops and places to meet</span></article><article><b>Greater Manchester links</b><span><TrainFront/> Road and rail connections nearby</span></article><article><b>Everyday green space</b><span><Trees/> Parks and walks in the local area</span></article></div></section>
    </section><aside className="enquiry-card"><p>{home.qualifier}</p><h2>{formatPrice(home.price)}</h2><div className="activity"><span/><p><b>Viewings managed online</b>Save your position and documents once</p></div><Link className="viewing-button direct-viewing" href={`/apply?property=${home.slug}`}>Request a viewing</Link><button onClick={share} className="share-button"><Share2/>{copied?"Link copied":"Share this home"}</button><a className="brochure-button product-source" href={home.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink/>View agent particulars</a><p className="host-note"><span className="host-avatar"><Check/></span><span><b>One reusable profile</b>Your buying position follows you to future viewings.</span></p></aside></div>
    <SalesTimeline postcode={market.postcode}/>
    <footer><Link className="brand" href="/"><span className="brand-mark">L</span>listwise<span className="brand-dot">.</span></Link><p>A better way to find and sell a home.</p><span>Representative photography · Confirm particulars with the agent.</span></footer>
  </main>
}
