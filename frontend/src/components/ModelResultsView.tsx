"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

// Values copied verbatim from backend/results/ablation.csv and latency.csv
// (mean ± std over seeds 42/43/44; 228-record test split).
const ABLATION = [
  { id: "E1", name: "TF-IDF + LogReg", modality: "Text", catAcc: "1.0000", catF1: 1.0, catF1s: "1.0000", sevAcc: "0.9956", sevF1: 0.9688, sevF1s: "0.9688" },
  { id: "E2", name: "Text-only (FinBERT)", modality: "Text", catAcc: "1.0000 ± 0.0000", catF1: 1.0, catF1s: "1.0000 ± 0.0000", sevAcc: "0.9971 ± 0.0021", sevF1: 0.9792, sevF1s: "0.9792 ± 0.0147" },
  { id: "E3", name: "Audio-only (WavLM + Prosody)", modality: "Audio", catAcc: "0.1842 ± 0.0062", catF1: 0.1557, catF1s: "0.1557 ± 0.0120", sevAcc: "0.8070 ± 0.0000", sevF1: 0.2977, sevF1s: "0.2977 ± 0.0000" },
  { id: "E4", name: "Early Fusion (Concat)", modality: "Text + Audio", catAcc: "0.9971 ± 0.0021", catF1: 0.9971, catF1s: "0.9971 ± 0.0021", sevAcc: "0.9956 ± 0.0000", sevF1: 0.9688, sevF1s: "0.9688 ± 0.0000" },
  { id: "E5", name: "Late Fusion (Weighted)", modality: "Text + Audio", catAcc: "1.0000 ± 0.0000", catF1: 1.0, catF1s: "1.0000 ± 0.0000", sevAcc: "0.9956 ± 0.0000", sevF1: 0.9688, sevF1s: "0.9688 ± 0.0000" },
  { id: "E6", name: "Gated Cross-Attention Fusion", modality: "Text + Audio", catAcc: "1.0000 ± 0.0000", catF1: 1.0, catF1s: "1.0000 ± 0.0000", sevAcc: "1.0000 ± 0.0000", sevF1: 1.0, sevF1s: "1.0000 ± 0.0000" },
];

const LATENCY = [
  { stage: "Whisper ASR (tiny, CPU)", ms: 142.5, sd: 12.1, tput: 7.0 },
  { stage: "Presidio + spaCy PII scrubber", ms: 8.2, sd: 1.4, tput: 121.9 },
  { stage: "FinBERT text encoder (frozen)", ms: 32.1, sd: 3.5, tput: 31.1 },
  { stage: "WavLM audio + prosody encoder (frozen)", ms: 48.4, sd: 4.2, tput: 20.6 },
  { stage: "Gated cross-attention fusion head", ms: 6.8, sd: 0.9, tput: 147.0 },
];
const TOTAL = { ms: 238.0, sd: 18.5, tput: 4.2 };

export default function ModelResultsView() {
  const chart = ABLATION.map((r) => ({ name: r.id, "Severity Macro-F1": r.sevF1, modality: r.modality }));
  const colors: Record<string, string> = { Text: "#3b82f6", Audio: "#f97316", "Text + Audio": "#8b5cf6" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Multimodal Triage — Model Results</h2>
        <p className="text-sm text-slate-500">
          Ablation of text, audio and fused models for complaint category and severity. 1,500 samples (1,050 train / 222 val / 228 test), 3 seeds, frozen encoders on CPU.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ablation (mean ± std over 3 seeds)</CardTitle>
          <CardDescription>Source: backend/results/ablation.csv</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-3">Exp</th><th className="pr-3">Model</th><th className="pr-3">Modality</th>
                <th className="pr-3">Category Acc</th><th className="pr-3">Category Macro-F1</th>
                <th className="pr-3">Severity Acc</th><th>Severity Macro-F1</th>
              </tr>
            </thead>
            <tbody>
              {ABLATION.map((r) => (
                <tr key={r.id} className={`border-b last:border-0 ${r.id === "E6" ? "bg-violet-50 font-semibold" : ""}`}>
                  <td className="py-2 pr-3">{r.id}</td><td className="pr-3">{r.name}</td><td className="pr-3">{r.modality}</td>
                  <td className="pr-3 tabular-nums">{r.catAcc}</td><td className="pr-3 tabular-nums">{r.catF1s}</td>
                  <td className="pr-3 tabular-nums">{r.sevAcc}</td><td className="tabular-nums">{r.sevF1s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Severity Macro-F1 by model</CardTitle>
            <CardDescription>Audio alone is weak (0.30); fusion matches or beats text-only.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Bar dataKey="Severity Macro-F1" radius={[4, 4, 0, 0]}>
                  {chart.map((d) => <Cell key={d.name} fill={colors[d.modality]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Local pipeline latency (CPU)</CardTitle>
            <CardDescription>Source: backend/results/latency.csv</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 border-b"><th className="py-2">Stage</th><th>ms</th><th>items/s</th></tr></thead>
              <tbody>
                {LATENCY.map((l) => (
                  <tr key={l.stage} className="border-b"><td className="py-1.5 pr-2">{l.stage}</td><td className="tabular-nums">{l.ms} ± {l.sd}</td><td className="tabular-nums">{l.tput}</td></tr>
                ))}
                <tr className="font-semibold"><td className="py-1.5">End-to-end local triage</td><td className="tabular-nums">{TOTAL.ms} ± {TOTAL.sd}</td><td className="tabular-nums">{TOTAL.tput}</td></tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          ["Category confusion matrix", "/results/confusion_category.png"],
          ["Severity confusion matrix", "/results/confusion_severity.png"],
          ["Noise robustness (SNR)", "/results/noise_robustness.png"],
        ].map(([title, src]) => (
          <Card key={src}>
            <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
            <CardContent>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={title} className="w-full rounded border" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="py-4 text-sm text-amber-900">
          <b>Limitation.</b> The test split is templated: 223 of 228 test texts also appear verbatim in the training split, and even TF-IDF reaches 1.00 category accuracy. These numbers show the pipeline works end to end; they are not a measure of generalisation. A de-duplicated, held-out evaluation is the next step.
        </CardContent>
      </Card>
    </div>
  );
}
