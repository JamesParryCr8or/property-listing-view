"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, Check, CheckCircle2, FileCheck2, FileText, ShieldCheck, UploadCloud } from "lucide-react";
import { buyingPositions, depositStatuses, mortgageStatuses } from "@/lib/viewing-profile-options";

const viewingSlots = ["Tue 9 Sep · 5:30 pm", "Thu 11 Sep · 6:00 pm", "Sat 13 Sep · 10:30 am"];
const requestedDocuments = [
  { kind: "deposit", label: "Proof of deposit", hint: "Savings statement or gifted-deposit letter", required: true },
  { kind: "mortgage", label: "Mortgage in principle", hint: "Decision or agreement in principle", required: true },
  { kind: "identity", label: "Photo ID", hint: "Passport or UK driving licence", required: true },
  { kind: "income", label: "Income evidence", hint: "Recent payslips or latest self-assessment", required: false },
] as const;

type UploadedFiles = Record<string, File>;
type SavedApplication = { application_reference: string; status: string; created_at: string };
type Profile = { name:string; email:string; phone:string; buying_position:string; deposit_status:string; mortgage_status:string };

export default function ViewingApplicationPage() {
  const [slot, setSlot] = useState(viewingSlots[0]);
  const [files, setFiles] = useState<UploadedFiles>({});
  const [state, setState] = useState<"idle" | "saving" | "error" | "complete">("idle");
  const [saved, setSaved] = useState<SavedApplication | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [propertySlug, setPropertySlug] = useState("oakfield-house-wilmslow");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("slot");
    const requestedProperty = new URLSearchParams(window.location.search).get("property");
    if (requested && viewingSlots.includes(requested)) setSlot(requested);
    if (requestedProperty) setPropertySlug(requestedProperty);
    fetch("/api/account").then((response) => response.json()).then((body) => setProfile(body.user ?? null)).catch(() => null);
  }, []);

  const readyCount = useMemo(() => requestedDocuments.filter((document) => files[document.kind]).length, [files]);

  function chooseFile(kind: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setFiles((current) => ({ ...current, [kind]: file }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    const form = new FormData(event.currentTarget);
    const documents = Object.entries(files).map(([kind, file]) => ({ kind, name: file.name, size: file.size }));

    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertySlug,
        viewingSlot: slot,
        applicantName: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        buyingPosition: form.get("buyingPosition"),
        depositStatus: form.get("depositStatus"),
        mortgageStatus: form.get("mortgageStatus"),
        documents,
        notes: form.get("notes"),
      }),
    });

    if (!response.ok) {
      setState("error");
      return;
    }

    const body = await response.json() as { application: SavedApplication };
    setSaved(body.application);
    setState("complete");
  }

  if (state === "complete" && saved) {
    return <main className="application-page"><header className="application-topbar"><Link className="application-brand" href="/"><span>L</span>listwise.</Link></header><section className="application-success"><span><CheckCircle2 /></span><p className="eyebrow">Application received</p><h1>Your viewing request is ready for review.</h1><p>We’ve saved your buying position and document checklist. The seller can now confirm the appointment.</p><div><small>Application reference</small><b>{saved.application_reference}</b></div><Link className="primary-link" href={profile?"/portal":"/account"}>{profile?"Open my property workspace":"Create an account to reuse this profile"}</Link></section></main>;
  }

  return (
    <main className="application-page">
      <header className="application-topbar"><Link className="application-brand" href="/"><span>L</span>listwise.</Link><Link className="back-to-listing" href="/"><ArrowLeft />Oakfield House</Link></header>
      <div className="application-layout">
        <form className="application-form" onSubmit={submit} key={profile?.email ?? "guest"}>
          <div className="application-intro"><p className="eyebrow">Book with confidence</p><h1>Request a viewing</h1><p>Tell the owners when you’d like to visit and share the documents that show you’re ready to move.</p></div>
          <ol className="application-steps"><li className="done"><Check />Viewing</li><li className="active">2 Your position</li><li>3 Documents</li><li>4 Review</li></ol>

          <section className="form-section"><div className="form-heading"><span>1</span><div><h2>Choose your viewing</h2><p>The owners host each appointment personally.</p></div></div><div className="slot-options">{viewingSlots.map((option) => <label key={option} className={slot === option ? "selected" : ""}><input type="radio" name="slot" value={option} checked={slot === option} onChange={() => setSlot(option)} /><span><b>{option}</b><small>45 minute appointment</small></span><Check /></label>)}</div></section>

          <section className="form-section"><div className="form-heading"><span>2</span><div><h2>Your details and buying position</h2><p>{profile?"Prefilled from your reusable Listwise profile.":<>This helps the seller prepare. <Link href="/account">Sign in to reuse your profile.</Link></>}</p></div></div><div className="field-grid"><label>Full name<input name="name" autoComplete="name" defaultValue={profile?.name} required /></label><label>Email address<input name="email" type="email" autoComplete="email" defaultValue={profile?.email} readOnly={Boolean(profile)} required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" defaultValue={profile?.phone} required /></label><label>Buying position<select name="buyingPosition" required defaultValue={profile?.buying_position||""}><option value="" disabled>Select your position</option>{buyingPositions.map(option=><option key={option}>{option}</option>)}</select></label><label>Deposit<select name="depositStatus" required defaultValue={profile?.deposit_status||""}><option value="" disabled>Select deposit status</option>{depositStatuses.map(option=><option key={option}>{option}</option>)}</select></label><label>Mortgage<select name="mortgageStatus" required defaultValue={profile?.mortgage_status||""}><option value="" disabled>Select mortgage status</option>{mortgageStatuses.map(option=><option key={option}>{option}</option>)}</select></label></div></section>

          <section className="form-section"><div className="form-heading"><span>3</span><div><h2>Document readiness</h2><p>Add what you have now. Your selections are recorded; secure file storage will be enabled separately.</p></div></div><div className="document-upload-list">{requestedDocuments.map((document) => { const file = files[document.kind]; return <label key={document.kind} className={file ? "uploaded" : ""}><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => chooseFile(document.kind, event)} /><span className="upload-icon">{file ? <FileCheck2 /> : <UploadCloud />}</span><span><b>{document.label}{!document.required && <small>Optional</small>}</b><small>{file ? file.name : document.hint}</small></span><em>{file ? "Added" : "Choose file"}</em></label>; })}</div><p className="upload-privacy"><ShieldCheck />For this first release, Listwise stores the document names and checklist status in Neon. File contents remain on your device until secure object storage is connected.</p></section>

          <section className="form-section"><div className="form-heading"><span>4</span><div><h2>Anything the owners should know?</h2><p>Keep this focused on the viewing or your moving position.</p></div></div><label className="notes-field">Notes<textarea name="notes" rows={4} placeholder="For example, your preferred move date or whether you need step-free access." /></label></section>

          {state === "error" && <p className="form-error">We couldn’t save the application. Please check the form and try again.</p>}
          <button className="application-submit" type="submit" disabled={state === "saving"}>{state === "saving" ? "Saving application…" : "Submit viewing application"}</button>
        </form>

        <aside className="application-summary"><img src="/listwise-home.png" alt="Oakfield House"/><p>Oakfield House</p><h2>£725,000</h2><dl><div><dt>Viewing</dt><dd>{slot}</dd></div><div><dt>Documents added</dt><dd>{readyCount} of {requestedDocuments.length}</dd></div></dl><div className="summary-note"><Banknote /><span><b>No reservation fee</b>You’re requesting a viewing, not making an offer.</span></div><div className="summary-note"><FileText /><span><b>One reusable profile</b>Your buying position can support future Listwise viewings.</span></div></aside>
      </div>
    </main>
  );
}
