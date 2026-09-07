"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bath, BedDouble, Camera, Check, ChevronRight, CircleCheck, Download, Expand, Heart, House, LoaderCircle, Pause, Play, Share2, Sparkles, TrainFront, Trees, Upload, Volume2, WandSparkles } from "lucide-react";

const soldHomes = [
  { x: 23, y: 29, price: 715, year: 2025, label: "14 Alderley Road" },
  { x: 68, y: 23, price: 648, year: 2023, label: "7 Oakfield Drive" },
  { x: 78, y: 61, price: 775, year: 2024, label: "22 Briar Lane" },
  { x: 41, y: 74, price: 692, year: 2022, label: "5 Beech Close" },
  { x: 12, y: 68, price: 730, year: 2024, label: "31 Oakfield Drive" },
];

const shots = [
  ["Front elevation", "Stand at the end of the drive and keep the house straight", true],
  ["Kitchen, wide angle", "Photograph from the doorway with worktops clear", true],
  ["Living room to garden", "Open the blinds and show the connection outside", false],
  ["Principal bedroom", "Shoot from two opposite corners", false],
  ["Rear garden", "Take one photo towards and one away from the house", false],
] as const;

export default function HomePage() {
  const [year, setYear] = useState(2026);
  const [favourite, setFavourite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [radius, setRadius] = useState("500m");
  const [studioStep, setStudioStep] = useState(2);
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const homes = useMemo(() => soldHomes.filter((home) => home.year <= year), [year]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/maps-config", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((config: { apiKey?: string }) => setMapsApiKey(config.apiKey ?? null))
      .catch(() => setMapsApiKey(null));

    return () => controller.abort();
  }, []);

  function share() {
    setCopied(true);
    navigator.clipboard?.writeText(window.location.href);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function toggleNarration() {
    if (audioRef.current) {
      if (audioState === "playing") {
        audioRef.current.pause();
        setAudioState("paused");
      } else {
        await audioRef.current.play();
        setAudioState("playing");
      }
      return;
    }

    setAudioState("loading");
    try {
      const response = await fetch("/api/narration");
      if (!response.ok) throw new Error("Narration unavailable");
      const audioUrl = URL.createObjectURL(await response.blob());
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.addEventListener("ended", () => setAudioState("idle"));
      audio.addEventListener("error", () => setAudioState("error"));
      await audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("error");
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">L</span>listwise<span className="brand-dot">.</span></a>
        <Tabs defaultValue="listing" className="view-tabs">
          <TabsList><TabsTrigger value="studio">Seller studio</TabsTrigger><TabsTrigger value="listing">Live listing</TabsTrigger></TabsList>
          <div className="header-actions"><button className="quiet-button">Save & exit</button><button className="avatar">JP</button></div>

          <TabsContent value="studio" className="page-content studio-wrap">
            <section className="studio-head">
              <div><p className="eyebrow">Your listing studio</p><h1>Let’s make Oakfield House look its best.</h1><p>We’ll guide the details. You bring what makes the home special.</p></div>
              <div className="score-ring"><strong>68%</strong><span>listing ready</span></div>
            </section>
            <Progress value={68} className="overall-progress" />
            <div className="studio-grid">
              <aside className="steps">
                {["Property basics", "Photography", "Your home’s story", "Details & documents", "Review & publish"].map((step, i) => (
                  <button key={step} onClick={() => setStudioStep(i + 1)} className={studioStep === i + 1 ? "active" : i < 1 ? "done" : ""}>
                    <span>{i < 1 ? <Check size={16}/> : i + 1}</span><div><b>{step}</b><small>{i === 0 ? "Complete" : i === 1 ? "2 of 5 shots added" : "Not started"}</small></div>
                  </button>
                ))}
              </aside>
              <section className="capture-card">
                <div className="capture-title"><div><p className="eyebrow">Step 2 of 5</p><h2>Your guided photo shoot</h2><p>Follow these prompts and we’ll check every image as you go.</p></div><Camera size={26}/></div>
                <div className="photo-tip"><Sparkles size={20}/><p><b>Best time today: 4:40–6:10 pm</b><br/>The front of your property should have soft, even light.</p></div>
                <div className="shot-list">
                  {shots.map(([name, hint, done]) => <article key={name} className={done ? "shot-done" : ""}>
                    <div className="shot-thumb">{done ? <img src="/listwise-home.png" alt="Uploaded property exterior"/> : <Camera size={20}/>}</div>
                    <div><b>{name}</b><p>{hint}</p>{done && <small><CircleCheck size={13}/> Quality checked</small>}</div>
                    <button aria-label={`Upload ${name}`}>{done ? <Check size={18}/> : <Upload size={18}/>}</button>
                  </article>)}
                </div>
                <div className="studio-footer"><button className="back">Back</button><Button className="next">Continue to your story <ChevronRight/></Button></div>
              </section>
              <aside className="preview-card"><p className="eyebrow">Live preview</p><img src="/listwise-home.png" alt="Oakfield House exterior"/><span className="preview-pill">Coming soon</span><h3>Oakfield House</h3><p>Wilmslow, Cheshire · £725,000</p><div className="mini-score"><WandSparkles size={18}/><span><b>Strong start</b>Your hero photo is ready</span></div></aside>
            </div>
          </TabsContent>

          <TabsContent value="listing" className="listing-page">
            <section className="hero-gallery">
              <img className="hero-image" src="/listwise-home.png" alt="Oakfield House, Wilmslow"/><div className="hero-shade"/>
              <div className="gallery-top"><span className="verified"><CircleCheck/> Property verified</span><button onClick={() => setFavourite(!favourite)} aria-label="Save property" className={favourite ? "liked" : ""}><Heart fill={favourite ? "currentColor" : "none"}/></button></div>
              <div className="hero-copy"><p>For sale · Wilmslow, Cheshire</p><h1>Oakfield House</h1><p className="hero-line">A beautifully considered family home, made for light-filled days and garden gatherings.</p><div className="hero-facts"><span><BedDouble/>4 bedrooms</span><span><Bath/>3 bathrooms</span><span><House/>2,184 sq ft</span></div><button className="narration-button" onClick={toggleNarration} disabled={audioState === "loading"}>{audioState === "loading" ? <LoaderCircle className="audio-spinner"/> : audioState === "playing" ? <Pause fill="currentColor"/> : <Volume2/>}<span><b>{audioState === "loading" ? "Preparing your audio…" : audioState === "playing" ? "Pause property story" : audioState === "paused" ? "Continue property story" : audioState === "error" ? "Try narration again" : "Listen to the property story"}</b><small>About 45 seconds · AI-narrated</small></span></button></div>
              <button className="gallery-button"><Expand/> View 18 photos</button>
            </section>
            <div className="listing-shell">
              <section className="listing-main">
                <div className="mobile-price"><p>Guide price</p><h2>£725,000</h2></div>
                <section className="owner-note"><div className="quote-mark">“</div><div><p className="eyebrow">In the owners’ words</p><blockquote>The kitchen at sunset is what we’ll miss most. In summer, the doors stay open and the whole ground floor becomes part of the garden.</blockquote><p>— James & Alex, owners since 2018</p></div></section>
                <section className="story-section"><p className="eyebrow">The home</p><h2>Thoughtful family living, inside and out.</h2><p>Set along one of Wilmslow’s leafy residential roads, Oakfield House pairs beautifully proportioned rooms with a relaxed, modern finish. The open-plan kitchen is the heart of the home, opening directly onto a south-west facing garden.</p><div className="feature-grid"><span><Trees/>South-west garden</span><span><TrainFront/>12 min walk to station</span><span><Sparkles/>Renovated in 2021</span><span><House/>Freehold</span></div></section>
                <section className="tour-card"><div className="tour-visual"><img src="/listwise-home.png" alt="3D tour preview"/><button><Play fill="currentColor"/></button></div><div><p className="eyebrow">Immersive tour</p><h2>Walk through at your own pace.</h2><p>Explore every room, understand the flow and look out into the garden.</p><Button>Start 3D tour <ChevronRight/></Button></div></section>
                <section className="market-section"><p className="eyebrow">Local market lens</p><div className="section-heading"><div><h2>What homes nearby actually sold for</h2><p>Verified sales within {radius} · showing up to {year}</p></div><div className="radius-switch">{["200m","500m","1 mile"].map(r => <button key={r} onClick={()=>setRadius(r)} className={radius===r?"active":""}>{r}</button>)}</div></div>
                  <div className="map-card">{mapsApiKey ? <iframe className="google-map" title="Map around Oakfield House" src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapsApiKey)}&q=Wilmslow%2C+Cheshire&zoom=15&maptype=roadmap`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/> : <><div className="map-grid"/><div className="road road-a"/><div className="road road-b"/><div className="road road-c"/></>}<div className="subject-pin"><House/><span>Oakfield House</span></div>{homes.map(home => <button key={home.label} className="price-pin" style={{left:`${home.x}%`,top:`${home.y}%`}} title={`${home.label}, sold ${home.year}`}>£{home.price}k<small>{home.year}</small></button>)}<div className="map-key">{mapsApiKey ? "Google Maps · HM Land Registry data" : "HM Land Registry data · Demo"}</div></div>
                  <div className="timeline"><span>1995</span><Slider value={[year]} min={1995} max={2026} step={1} onValueChange={v=>setYear(v[0])}/><b>{year}</b></div>
                </section>
                <section className="location-section"><p className="eyebrow">Around the home</p><h2>A quiet address, close to everything.</h2><div className="location-cards"><article><b>Wilmslow station</b><span>12 min walk</span></article><article><b>The Carrs Park</b><span>8 min walk</span></article><article><b>Ofsted-rated schools</b><span>3 within 1 mile</span></article></div></section>
              </section>
              <aside className="enquiry-card"><p>Guide price</p><h2>£725,000</h2><div className="activity"><span/><p><b>Popular this week</b>14 viewing requests</p></div><Dialog><DialogTrigger asChild><Button className="viewing-button">Book a viewing</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Choose your viewing</DialogTitle><DialogDescription>Meet the owners at Oakfield House. Select a convenient time and we’ll confirm it by email.</DialogDescription></DialogHeader><div className="dates">{["Tue 9 Sep · 5:30 pm","Thu 11 Sep · 6:00 pm","Sat 13 Sep · 10:30 am"].map(d=><button key={d}>{d}<ChevronRight/></button>)}</div></DialogContent></Dialog><button onClick={share} className="share-button"><Share2/>{copied?"Link copied":"Share this home"}</button><button className="brochure-button"><Download/>Download brochure</button><p className="host-note"><span className="host-avatar">JA</span><span><b>Hosted by the owners</b>Get honest answers from the people who know it best.</span></p></aside>
            </div>
            <footer><a className="brand" href="#"><span className="brand-mark">L</span>listwise<span className="brand-dot">.</span></a><p>A better way to list your home.</p><span>Property particulars are illustrative for this prototype.</span></footer>
          </TabsContent>
        </Tabs>
      </header>
    </main>
  );
}
