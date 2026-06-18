"use client";

import { FormEvent, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

type JsonObject = Record<string, unknown>;

const disciplines = ["Agriculture", "Computer Science", "Engineering", "Economics", "Medicine", "Education"];
const sectors = ["Agriculture", "Technology", "Manufacturing", "Healthcare", "Education", "Fintech"];

export default function HomePage() {
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [email, setEmail] = useState("student@example.com");
  const [password, setPassword] = useState("StrongPassword123");
  const [userType, setUserType] = useState("STUDENT");
  const [lastResponse, setLastResponse] = useState<JsonObject | JsonObject[] | null>(null);
  const [projectId, setProjectId] = useState("");
  const [problemId, setProblemId] = useState("");

  const isAuthed = token.length > 0;
  const authHeader = useMemo(() => (isAuthed ? { Authorization: `Bearer ${token}` } : {}), [isAuthed, token]);

  async function request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...options.headers
      }
    });
    const json = await response.json() as JsonObject | JsonObject[];
    setLastResponse(json);
    return json;
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, userType })
    });
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loginFromState();
  }

  async function loginFromState() {
    const json = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (!Array.isArray(json)) {
      setToken(typeof json["accessToken"] === "string" ? json["accessToken"] : "");
      setRefreshToken(typeof json["refreshToken"] === "string" ? json["refreshToken"] : "");
    }
  }

  async function saveScholar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await request("/scholar/profile", {
      method: "PUT",
      body: JSON.stringify({
        fullName: String(form.get("fullName")),
        institution: String(form.get("institution")),
        department: String(form.get("department")),
        graduationYear: Number(form.get("graduationYear")),
        disciplineFocus: String(form.get("disciplineFocus")),
        bio: String(form.get("bio"))
      })
    });
  }

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await request("/company/profile", {
      method: "PUT",
      body: JSON.stringify({
        name: String(form.get("name")),
        sector: String(form.get("sector")),
        contactEmail: String(form.get("contactEmail")),
        description: String(form.get("description"))
      })
    });
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const json = await request("/projects", {
      method: "POST",
      body: JSON.stringify({
        title: String(form.get("title")),
        abstract: String(form.get("abstract")),
        discipline: String(form.get("discipline")),
        year: Number(form.get("year")),
        fileUrl: String(form.get("fileUrl")),
        consentLevel: "PUBLIC",
        allowsContact: true,
        allowsCommercialUse: false
      })
    });
    if (!Array.isArray(json) && typeof json["projectId"] === "string") {
      setProjectId(json["projectId"]);
    }
  }

  async function postProblem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const json = await request("/problems", {
      method: "POST",
      body: JSON.stringify({
        title: String(form.get("title")),
        description: String(form.get("description")),
        sector: String(form.get("sector")),
        skillsRequired: String(form.get("skills")).split(",").map((skill) => skill.trim()).filter(Boolean),
        urgency: "HIGH",
        isOpenToStudents: true
      })
    });
    if (!Array.isArray(json) && typeof json["problemId"] === "string") {
      setProblemId(json["problemId"]);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[280px_1fr_360px]">
        <aside className="space-y-4">
          <div className="border border-zinc-300 bg-white p-4">
            <div className="text-xl font-semibold">Scholva</div>
            <div className="mt-1 text-sm text-zinc-600">MVP operations console</div>
          </div>

          <form onSubmit={register} className="space-y-3 border border-zinc-300 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase text-zinc-500">Identity</h2>
            <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <input className="field" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
            <select className="field" value={userType} onChange={(event) => setUserType(event.target.value)}>
              <option value="STUDENT">Student</option>
              <option value="INDUSTRY">Industry</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button className="command" type="submit">Register</button>
              <button className="command" type="button" onClick={() => void loginFromState()}>Login</button>
            </div>
            <div className="text-xs text-zinc-500">{isAuthed ? "Authenticated" : "No active session"}</div>
            {refreshToken.length > 0 ? <div className="truncate text-xs text-zinc-400">{refreshToken}</div> : null}
          </form>
        </aside>

        <section className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <form onSubmit={saveScholar} className="space-y-3 border border-zinc-300 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase text-zinc-500">Scholar Profile</h2>
              <input className="field" name="fullName" defaultValue="Amina Yusuf" placeholder="Full name" />
              <input className="field" name="institution" defaultValue="University of Jos" placeholder="Institution" />
              <input className="field" name="department" defaultValue="Agricultural Science" placeholder="Department" />
              <input className="field" name="graduationYear" defaultValue="2026" type="number" />
              <select className="field" name="disciplineFocus" defaultValue="Agriculture">
                {disciplines.map((discipline) => <option key={discipline}>{discipline}</option>)}
              </select>
              <textarea className="field min-h-20" name="bio" defaultValue="Interested in post-harvest systems and food security." />
              <button className="command" disabled={!isAuthed}>Save Scholar</button>
            </form>

            <form onSubmit={saveCompany} className="space-y-3 border border-zinc-300 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase text-zinc-500">Company Profile</h2>
              <input className="field" name="name" defaultValue="Lagos Cassava Processors" placeholder="Company name" />
              <select className="field" name="sector" defaultValue="Agriculture">
                {sectors.map((sector) => <option key={sector}>{sector}</option>)}
              </select>
              <input className="field" name="contactEmail" defaultValue="ops@example.com" placeholder="Contact email" />
              <textarea className="field min-h-20" name="description" defaultValue="Processing and logistics company reducing cassava post-harvest losses." />
              <button className="command" disabled={!isAuthed}>Save Company</button>
            </form>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <form onSubmit={createProject} className="space-y-3 border border-zinc-300 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase text-zinc-500">Project Upload</h2>
              <input className="field" name="title" defaultValue="Solar-assisted cassava drying system" />
              <textarea className="field min-h-20" name="abstract" defaultValue="A study of low-cost solar drying for reducing cassava post-harvest losses among smallholder processors in Plateau State." />
              <select className="field" name="discipline" defaultValue="Agriculture">
                {disciplines.map((discipline) => <option key={discipline}>{discipline}</option>)}
              </select>
              <input className="field" name="year" defaultValue="2026" type="number" />
              <input className="field" name="fileUrl" defaultValue="https://res.cloudinary.com/demo/raw/upload/sample.pdf" />
              <button className="command" disabled={!isAuthed}>Create Project</button>
            </form>

            <form onSubmit={postProblem} className="space-y-3 border border-zinc-300 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase text-zinc-500">Industry Problem</h2>
              <input className="field" name="title" defaultValue="Cassava post-harvest loss reduction" />
              <textarea className="field min-h-20" name="description" defaultValue="We need low-cost drying, storage, and logistics methods to reduce cassava spoilage before processing." />
              <select className="field" name="sector" defaultValue="Agriculture">
                {sectors.map((sector) => <option key={sector}>{sector}</option>)}
              </select>
              <input className="field" name="skills" defaultValue="post-harvest, drying, logistics" />
              <button className="command" disabled={!isAuthed}>Post Problem</button>
            </form>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button className="command" disabled={!isAuthed} onClick={() => void request("/suggestions/generate", { method: "POST" })}>Suggest</button>
            <button className="command" disabled={!isAuthed} onClick={() => void request("/subscriptions/mock-activate", { method: "POST", body: JSON.stringify({ planTier: "PROFESSIONAL" }) })}>Plan</button>
            <button className="command" onClick={() => void request("/projects")}>Projects</button>
            <button className="command" onClick={() => void request("/problems")}>Problems</button>
            <button className="command" disabled={!isAuthed} onClick={() => void request("/suggestions")}>Topics</button>
            <button className="command" disabled={!isAuthed || projectId.length === 0} onClick={() => void request(`/projects/${projectId}/process`, { method: "POST" })}>Publish</button>
            <button className="command" disabled={!isAuthed || problemId.length === 0} onClick={() => void request(`/matching/run/${problemId}`, { method: "POST" })}>Match</button>
          </div>

          <pre className="max-h-[720px] overflow-auto border border-zinc-300 bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </aside>
      </div>
    </main>
  );
}
