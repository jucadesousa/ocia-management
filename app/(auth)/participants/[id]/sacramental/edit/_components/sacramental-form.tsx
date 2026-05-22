"use client";
import { useActionState } from "react";
import Link from "next/link";
import { upsertSacramentalRecord } from "@/app/actions/sacramental";
import type { SacramentalFormState } from "@/app/actions/sacramental";

type Defaults = {
  isBaptized: boolean | null;
  baptismType: string;
  baptismDenomination: string | null;
  baptismDate: string | null;
  baptismParish: string | null;
  baptismProofStatus: string;
  hasFirstCommunion: boolean | null;
  hasConfirmation: boolean | null;
  marriageStatus: string | null;
  marriedToCatholic: boolean | null;
  marriedByCatholicPriest: boolean | null;
  hadPriorMarriage: boolean | null;
  spouseHadPriorMarriage: boolean | null;
  marriageCertReceived: boolean;
  annulmentStatus: string | null;
  hasChildren: boolean | null;
  childrenNotes: string | null;
  riteOfAcceptanceDate: string | null;
  electionDate: string | null;
  easterVigilDate: string | null;
  completedAt: string | null;
};

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";
const headingCls = "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3";

function NullableBoolSelect({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: boolean | null;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select
        name={name}
        defaultValue={value === null ? "" : String(value)}
        className={inputCls}
      >
        <option value="">Unknown</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>
  );
}

function BoolSelect({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: boolean;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select name={name} defaultValue={String(value)} className={inputCls}>
        <option value="false">No</option>
        <option value="true">Yes</option>
      </select>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  type = "text",
}: {
  name: string;
  label: string;
  value: string | null;
  type?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={value ?? ""}
        className={inputCls}
      />
    </div>
  );
}

export function SacramentalForm({
  participantId,
  defaults,
}: {
  participantId: string;
  defaults: Defaults | null;
}) {
  const d = defaults;
  const boundAction = upsertSacramentalRecord.bind(null, participantId);
  const [state, formAction, pending] = useActionState<SacramentalFormState, FormData>(
    boundAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      {/* Baptism */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className={headingCls}>Baptism</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NullableBoolSelect name="isBaptized" label="Baptized?" value={d?.isBaptized ?? null} />
          <div>
            <label className={labelCls}>Baptism type</label>
            <select name="baptismType" defaultValue={d?.baptismType ?? "NONE"} className={inputCls}>
              <option value="NONE">Not baptized</option>
              <option value="CATHOLIC">Catholic</option>
              <option value="OTHER_VALID">Other Christian — trinitarian (valid)</option>
              <option value="OTHER_UNVERIFIED">Other Christian — trinitarian (unverified)</option>
            </select>
          </div>
          <Field name="baptismDenomination" label="Denomination / church" value={d?.baptismDenomination ?? null} />
          <Field name="baptismDate" label="Baptism date" value={d?.baptismDate ?? null} type="date" />
          <Field name="baptismParish" label="Baptism parish" value={d?.baptismParish ?? null} />
          <div>
            <label className={labelCls}>Baptism proof received</label>
            <select
              name="baptismProofStatus"
              defaultValue={d?.baptismProofStatus ?? "NONE"}
              className={inputCls}
            >
              <option value="NONE">None</option>
              <option value="CERTIFICATE">Certificate</option>
              <option value="LETTER">Letter from faith community</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Other Sacraments */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className={headingCls}>Other Sacraments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NullableBoolSelect name="hasFirstCommunion" label="First Communion?" value={d?.hasFirstCommunion ?? null} />
          <NullableBoolSelect name="hasConfirmation" label="Confirmation?" value={d?.hasConfirmation ?? null} />
        </div>
      </div>

      {/* Marriage */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className={headingCls}>Marriage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Marriage status</label>
            <select
              name="marriageStatus"
              defaultValue={d?.marriageStatus ?? ""}
              className={inputCls}
            >
              <option value="">—</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Separated">Separated</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <NullableBoolSelect name="marriedToCatholic" label="Married to a Catholic?" value={d?.marriedToCatholic ?? null} />
          <NullableBoolSelect name="marriedByCatholicPriest" label="Married by a Catholic priest?" value={d?.marriedByCatholicPriest ?? null} />
          <NullableBoolSelect name="hadPriorMarriage" label="Had a prior marriage?" value={d?.hadPriorMarriage ?? null} />
          <NullableBoolSelect name="spouseHadPriorMarriage" label="Spouse had prior marriage?" value={d?.spouseHadPriorMarriage ?? null} />
          <BoolSelect name="marriageCertReceived" label="Marriage cert received" value={d?.marriageCertReceived ?? false} />
          <div>
            <label className={labelCls}>Annulment status</label>
            <select
              name="annulmentStatus"
              defaultValue={d?.annulmentStatus ?? ""}
              className={inputCls}
            >
              <option value="">—</option>
              <option value="None">None</option>
              <option value="Pending">Pending</option>
              <option value="Granted">Granted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Children */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className={headingCls}>Children</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NullableBoolSelect name="hasChildren" label="Has children?" value={d?.hasChildren ?? null} />
          <div className="sm:col-span-2">
            <label className={labelCls}>Children notes</label>
            <textarea
              name="childrenNotes"
              defaultValue={d?.childrenNotes ?? ""}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* OCIA Milestones */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className={headingCls}>OCIA Milestones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field name="riteOfAcceptanceDate" label="Rite of Acceptance" value={d?.riteOfAcceptanceDate ?? null} type="date" />
          <Field name="electionDate" label="Election date" value={d?.electionDate ?? null} type="date" />
          <Field name="easterVigilDate" label="Easter Vigil date" value={d?.easterVigilDate ?? null} type="date" />
          <Field name="completedAt" label="Completed at" value={d?.completedAt ?? null} type="date" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href={`/participants/${participantId}?tab=sacramental`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : "Save sacramental record"}
        </button>
      </div>
    </form>
  );
}
