"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, Check, CheckCircle2, FileCheck2, FileText, ShieldCheck, UploadCloud } from "lucide-react";

const viewingSlots = ["Tue 9 Sep · 5:30 pm", "Thu 11 Sep · 6:00 pm", "Sat 13 Sep · 10:30 am"];
const requestedDocuments = [
  { kind: "deposit", label: "Proof of deposit", hint: "Savings statement or gifted-deposit letter", required: true },
  { kind: "mortgage", label: "Mortgage in principle", hint: "Decision or agreement in principle", required: true },
  { kind: "identity", label: "Photo ID", hint: "Passport or UK driving licence", required: true },
  { kind: "income", label: "Income evidence", hint: "Recent payslips or latest self-assessment", required: false },
] as const;

type UploadedFiles = Record<string, File>;
type SavedApplication = { application_reference: string; status: string; created_at: string };

export default function ViewingApplicationPage() {
  const [slot, setSlot] = useState(viewingSlots[0]);
  const [files, setFiles] = useState<UploadedFiles>({});
  const [state, setState] = useState<"idle" | "saving" | "error" | "complete">("idle");
  const [saved, setSaved] = useState<SavedApplication | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("slot");
    if (requested && viewingSlots.includes(requested)) setSlot(requested);
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
        propertySlug: "oakfield-house-wilmslow",
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
    return <main className="application-page"><header className="application-topbar"><Link className="application-brand" href="/"><span>L</span>listwise.</Link></header><section className="application-success"><span><CheckCircle2 /></span><p className="eyebrow">Application received</p><h1>Your viewing request is ready for review.</h1><p>We’ve saved your buying position and document checklist against Oakfield House. The seller can now confirm the appointment.</p><div><small>Application reference</small><b>{saved.application_reference}</b></div><Link className="primary-link" href="/">Return to Oakfield House</Link></section></main>;
  }

  return (
    <main className="application-page">
      <header className="application-topbar"><Link className="application-brand" href="/"><span>L</span>listwise.</Link><Link className="back-to-listing" href="/"><ArrowLeft />Oakfield House</Link></header>
      <div className="application-layout">
        <form className="application-form" onSubmit={submit}>
          <div className="application-intro"><p className="eyebrow">Book with confidence</p><h1>Request a viewing</h1><p>Tell the owners when you’d like to visit and share the documents that show you’re ready to move.</p></div>
          <ol className="application-steps"><li className="done"><Check />Viewing</li><li className="active">2 Your position</li><li>3 Documents</li><li>4 Review</li></ol>

          <section className="form-section"><div className="form-heading"><span>1</span><div><h2>Choose your viewing</h2><p>The owners host each appointment personally.</p></div></div><div className="slot-options">{viewingSlots.map((option) => <label key={option} className={slot === option ? "selected" : ""}><input type="radio" name="slot" value={option} checked={slot === option} onChange={() => setSlot(option)} /><span><b>{option}</b><small>45 minute appointment</small></span><Check /></label>)}</div></section>

          <section className="form-section"><div className="form-heading"><span>2</span><div><h2>Your details and buying position</h2><p>This helps the seller prepare for a useful conversation.</p></div></div><div className="field-grid"><label>Full name<input name="name" autoComplete="name" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" required /></label><label>Buying position<select name="buyingPosition" required defaultValue=""><option value="" disabled>Select your position</option><option>First-time buyer</option><option>Property under offer</option><option>Property on the market</option><option>Not yet on the market</option><option>Cash buyer</option></select></label><label>Deposit<select name="depositStatus" required defaultValue=""><option value="" disabled>Select deposit status</option><option>Funds available</option><option>Gifted deposit confirmed</option><option>Still building deposit</option></select></label><label>Mortgage<select name="mortgageStatus" required defaultValue=""><option value="" disabled>Select mortgage status</option><option>Agreement in principle</option><option>Cash purchase</option><option>Speaking to a broker</option><option>Not arranged yet</option></select></label></div></section>

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
