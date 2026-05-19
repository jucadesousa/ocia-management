"use client";
import { useActionState } from "react";
import type { ParticipantFormState } from "@/app/actions/participants";
import type { Participant } from "@prisma/client";

type Props = {
  action: (state: ParticipantFormState, formData: FormData) => Promise<ParticipantFormState>;
  defaultValues?: Partial<Participant>;
};

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

function Field({
  label, name, type = "text", required, placeholder, defaultValue, children, colSpan,
}: {
  label: string; name: string; type?: string; required?: boolean;
  placeholder?: string; defaultValue?: string; children?: React.ReactNode;
  colSpan?: "full";
}) {
  return (
    <div className={colSpan === "full" ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className={labelCls}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children ?? (
        <input
          id={name} name={name} type={type} required={required}
          placeholder={placeholder} defaultValue={defaultValue ?? ""}
          className={inputCls}
        />
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 sm:col-span-2">{title}</h2>;
}

export function ParticipantForm({ action, defaultValues: d }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const dob = d?.dateOfBirth ? new Date(d.dateOfBirth).toISOString().split("T")[0] : "";
  const interviewDate = d?.interviewDate ? new Date(d.interviewDate).toISOString().split("T")[0] : "";

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionHeader title="Identity" />
        <Field label="First name" name="firstName" required defaultValue={d?.firstName} />
        <Field label="Last name" name="lastName" required defaultValue={d?.lastName} />
        <Field label="Maiden name" name="maidenName" defaultValue={d?.maidenName ?? ""} />
        <Field label="Full name (display)" name="fullName" placeholder="Auto-filled from first + last" defaultValue={d?.fullName} />
        <Field label="Preferred name / goes-by" name="preferredName" defaultValue={d?.preferredName ?? ""} />
        <Field label="Date of birth" name="dateOfBirth" type="date" defaultValue={dob} />
        <Field label="Place of birth" name="placeOfBirth" defaultValue={d?.placeOfBirth ?? ""} />

        <SectionHeader title="Contact" />
        <Field label="Phone (home/mobile)" name="phone" type="tel" defaultValue={d?.phone ?? ""} />
        <Field label="Phone (work)" name="phoneWork" type="tel" defaultValue={d?.phoneWork ?? ""} />
        <Field label="Email" name="email" type="email" defaultValue={d?.email ?? ""} colSpan="full" />
        <Field label="Street address" name="address" defaultValue={d?.address ?? ""} colSpan="full" />
        <Field label="City" name="city" defaultValue={d?.city ?? ""} />
        <Field label="State" name="state" placeholder="e.g. TX" defaultValue={d?.state ?? ""} />
        <Field label="Zip code" name="zipCode" defaultValue={d?.zipCode ?? ""} />

        <SectionHeader title="Family & Work" />
        <Field label="Spouse name" name="spouseName" defaultValue={d?.spouseName ?? ""} />
        <Field label="Occupation" name="occupation" defaultValue={d?.occupation ?? ""} />

        <SectionHeader title="Background" />
        <Field label="Current religion / affiliation" name="currentReligion" placeholder="e.g. Baptist, None" defaultValue={d?.currentReligion ?? ""} />
        <Field label="Marital status" name="maritalStatus">
          <select id="maritalStatus" name="maritalStatus" defaultValue={d?.maritalStatus ?? ""} className={inputCls}>
            <option value="">Select…</option>
            {["Single", "Married", "Separated", "Divorced", "Widowed"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>

        <SectionHeader title="OCIA Placement" />
        <Field label="Group" name="group" required>
          <select id="group" name="group" required defaultValue={d?.group ?? ""} className={inputCls}>
            <option value="" disabled>Select group…</option>
            <option value="ENGLISH">English</option>
            <option value="SPANISH">Spanish</option>
          </select>
        </Field>
        <Field label="Stage" name="ociaStage">
          <select id="ociaStage" name="ociaStage" defaultValue={d?.ociaStage ?? "INQUIRY"} className={inputCls}>
            {[["INQUIRY","Inquiry"],["CATECHUMEN","Catechumen"],["CANDIDATE","Candidate"],
              ["ELECT","Elect"],["MYSTAGOGY","Mystagogy"],["COMPLETED","Completed"]].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Status" name="status">
          <select id="status" name="status" defaultValue={d?.status ?? "ACTIVE"} className={inputCls}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </Field>
        <Field label="Sponsor name" name="sponsorName" placeholder="e.g. Robert Smith" defaultValue={d?.sponsorName ?? ""} />

        <SectionHeader title="Admin" />
        <Field label="Interview date" name="interviewDate" type="date" defaultValue={interviewDate} />
        <Field label="Notes / additional comments" name="notes" colSpan="full">
          <textarea id="notes" name="notes" rows={3} defaultValue={d?.notes ?? ""} className={`${inputCls} resize-none`} />
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : "Save participant"}
        </button>
        <a href="/participants" className="text-sm text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
