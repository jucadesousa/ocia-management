"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<Element | null>(null);

  useEffect(() => {
    portalRef.current = document.body;
    setMounted(true);
  }, []);

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:mx-4 sm:rounded-xl rounded-t-2xl shadow-xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">OCIA Profile — Legend</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {LEGEND.map(({ label, color, desc }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className={`self-start px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                {label}
              </span>
              <p className="text-sm text-gray-600 break-words">{desc}</p>
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-1 pb-2">
            The profile is derived automatically from the sacramental record. Update it via the participant&apos;s Sacramental tab.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors text-xs font-bold leading-none shrink-0"
        aria-label="OCIA Profile legend"
      >
        i
      </button>

      {mounted && open && createPortal(modal, portalRef.current!)}
    </>
  );
}
