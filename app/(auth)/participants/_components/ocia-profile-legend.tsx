"use client";
import { useState } from "react";

const LEGEND = [
  { label: "Catechumen",                    color: "bg-purple-100 text-purple-700",  desc: "Never baptized — needs Baptism, First Communion, and Confirmation at Easter Vigil." },
  { label: "Candidate (Baptism Unverified)", color: "bg-yellow-100 text-yellow-700", desc: "Baptized in another Christian denomination — trinitarian validity not yet confirmed." },
  { label: "Candidate",                     color: "bg-blue-100 text-blue-700",      desc: "Baptized in another Christian denomination with a confirmed valid trinitarian baptism — seeking full communion." },
  { label: "Candidate for Sacraments",      color: "bg-orange-100 text-orange-700",  desc: "Baptized Catholic but has not yet received First Communion." },
  { label: "Candidate for Confirmation",    color: "bg-teal-100 text-teal-700",      desc: "Baptized Catholic with First Communion — still needs Confirmation." },
  { label: "Fully Initiated",               color: "bg-green-100 text-green-700",    desc: "Has received all three sacraments: Baptism, Eucharist, and Confirmation." },
  { label: "Unknown",                       color: "bg-gray-100 text-gray-500",      desc: "No sacramental record has been filled in yet." },
];

export function OciaProfileLegend() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors text-xs font-bold leading-none"
        aria-label="OCIA Profile legend"
      >
        i
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">OCIA Profile — Legend</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <ul className="space-y-3">
              {LEGEND.map(({ label, color, desc }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                    {label}
                  </span>
                  <span className="text-sm text-gray-600">{desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-400">
              The profile is derived automatically from the sacramental record. Update it via the participant&apos;s Sacramental tab.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
