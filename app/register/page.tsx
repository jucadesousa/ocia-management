"use client";
import { useActionState, useState } from "react";
import { registerParticipant } from "@/app/actions/participants";

type Lang = "en" | "es";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

// ── Translations ──────────────────────────────────────────────────────────────

const T = {
  en: {
    title: "Rite of Christian Initiation of Adults",
    subtitle: "Saint Bartholomew the Apostle Catholic Church · Katy, TX",
    intro:
      "Interested in learning more about the Catholic faith? Fill out this form and someone from our team will contact you.",
    sPersonal: "Personal Information",
    sReligious: "Religious Affiliation",
    sMarital: "Marital Status",
    sOcia: "OCIA Information",
    sComments: "Additional Comments",
    lastName: "Last name",
    firstName: "First name",
    maidenName: "Maiden name",
    preferredName: "Goes by / preferred name",
    dateOfBirth: "Date of birth",
    placeOfBirth: "Place of birth",
    placeOfBirthPh: "City, State / Country",
    address: "Street address",
    addressPh: "123 Main St",
    city: "City",
    cityPh: "Katy",
    state: "State",
    statePh: "TX",
    zipCode: "Zip code",
    zipPh: "77450",
    phone: "Phone (home / mobile)",
    phonePh: "(832) 555-0100",
    spouseName: "Spouse / partner name",
    email: "Email address",
    emailPh: "you@example.com",
    occupation: "Occupation",
    phoneWork: "Phone (work)",
    phoneWorkPh: "(832) 555-0200",
    isBaptized: "Have you been baptized?",
    baptismDenomination: "If yes, in what denomination or church?",
    baptismDenominationPh: "e.g. Methodist, Baptist, Catholic…",
    currentReligion: "Religious affiliation now",
    currentReligionPh: "e.g. Baptist, None, Unknown",
    maritalOptions: [
      ["Married", "Married"],
      ["Single", "Single"],
      ["Separated", "Separated"],
      ["Divorced", "Divorced"],
      ["Widowed", "Widowed"],
    ] as [string, string][],
    ifMarried: "If married",
    marriedToCatholic: "Are you married to a Catholic?",
    marriedByCatholicPriest: "Were you married by a Catholic Priest or Deacon?",
    hadPriorMarriage: "Were you ever married prior to the present marriage?",
    spouseHadPriorMarriage:
      "Was your spouse ever married prior to the present marriage?",
    hasChildren: "Do you have children?",
    childrenNotes: "List children's names and ages",
    childrenNotesPh: "e.g. Maria, 8 · Carlos, 5",
    group: "Language group",
    groupRequired: "Language group is required.",
    groupPlaceholder: "Select…",
    groupEnglish: "English",
    groupSpanish: "Spanish / Español",
    sponsorName: "Sponsor name",
    sponsorNamePh: "Name of your sponsor (if known)",
    additionalComments: "Additional comments",
    requiredNote:
      "Fields marked * are required. All other fields are optional but help our team serve you better.",
    submit: "Submit registration",
    submitting: "Submitting…",
    yes: "Yes",
    no: "No",
    successTitle: "Thank you for registering!",
    successBody:
      "We have received your information. A member of our OCIA team will be in touch with you soon.",
    successChurch: "Saint Bartholomew the Apostle Catholic Church",
    changeLanguage: "Change language",
  },
  es: {
    title: "Rito de Iniciación Cristiana de Adultos",
    subtitle: "Parroquia San Bartolomé el Apóstol · Katy, TX",
    intro:
      "¿Está interesado/a en aprender más sobre la fe católica? Complete este formulario y alguien de nuestro equipo se pondrá en contacto con usted.",
    sPersonal: "Información Personal",
    sReligious: "Afiliación Religiosa",
    sMarital: "Estado Civil",
    sOcia: "Información del RICA",
    sComments: "Comentarios Adicionales",
    lastName: "Apellido",
    firstName: "Nombre",
    maidenName: "Apellido de soltera",
    preferredName: "Apodo / nombre preferido",
    dateOfBirth: "Fecha de nacimiento",
    placeOfBirth: "Lugar de nacimiento",
    placeOfBirthPh: "Ciudad, Estado / País",
    address: "Dirección",
    addressPh: "123 Calle Principal",
    city: "Ciudad",
    cityPh: "Katy",
    state: "Estado",
    statePh: "TX",
    zipCode: "Código postal",
    zipPh: "77450",
    phone: "Teléfono (casa / celular)",
    phonePh: "(832) 555-0100",
    spouseName: "Nombre del cónyuge / pareja",
    email: "Correo electrónico",
    emailPh: "correo@ejemplo.com",
    occupation: "Ocupación",
    phoneWork: "Teléfono (trabajo)",
    phoneWorkPh: "(832) 555-0200",
    isBaptized: "¿Ha sido bautizado/a?",
    baptismDenomination: "Si es así, ¿en qué denominación o iglesia?",
    baptismDenominationPh: "p. ej. Metodista, Bautista, Católica…",
    currentReligion: "Afiliación religiosa actual",
    currentReligionPh: "p. ej. Bautista, Ninguna, Desconocida",
    maritalOptions: [
      ["Married", "Casado/a"],
      ["Single", "Soltero/a"],
      ["Separated", "Separado/a"],
      ["Divorced", "Divorciado/a"],
      ["Widowed", "Viudo/a"],
    ] as [string, string][],
    ifMarried: "Si está casado/a",
    marriedToCatholic: "¿Está casado/a con un/a católico/a?",
    marriedByCatholicPriest: "¿Se casó ante un Sacerdote o Diácono Católico?",
    hadPriorMarriage: "¿Estuvo casado/a antes del presente matrimonio?",
    spouseHadPriorMarriage:
      "¿Su cónyuge estuvo casado/a antes del presente matrimonio?",
    hasChildren: "¿Tiene hijos/as?",
    childrenNotes: "Liste los nombres y edades de sus hijos/as",
    childrenNotesPh: "p. ej. María, 8 · Carlos, 5",
    group: "Grupo de idioma",
    groupRequired: "El grupo de idioma es obligatorio.",
    groupPlaceholder: "Seleccione…",
    groupEnglish: "Inglés",
    groupSpanish: "Español",
    sponsorName: "Nombre del padrino / madrina",
    sponsorNamePh: "Nombre de su padrino/madrina (si lo sabe)",
    additionalComments: "Comentarios adicionales",
    requiredNote:
      "Los campos marcados con * son obligatorios. Los demás son opcionales pero ayudan a nuestro equipo a servirle mejor.",
    submit: "Enviar registro",
    submitting: "Enviando…",
    yes: "Sí",
    no: "No",
    successTitle: "¡Gracias por registrarse!",
    successBody:
      "Hemos recibido su información. Un miembro de nuestro equipo del RICA se pondrá en contacto con usted pronto.",
    successChurch: "Parroquia San Bartolomé el Apóstol",
    changeLanguage: "Cambiar idioma",
  },
};

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  children,
  colSpan,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  children?: React.ReactNode;
  colSpan?: "full";
}) {
  return (
    <div className={colSpan === "full" ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children ?? (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={inputCls}
        />
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2 sm:col-span-2 mt-2">
      {title}
    </h2>
  );
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (!d) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)})${d.slice(3)}`;
  return `(${d.slice(0, 3)})${d.slice(3, 6)}-${d.slice(6)}`;
}

function PhoneInput({ name, placeholder }: { name: string; placeholder?: string }) {
  const [value, setValue] = useState("");
  return (
    <input
      id={name}
      name={name}
      type="tel"
      value={value}
      onChange={(e) => setValue(formatPhone(e.target.value))}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function YesNoGroup({
  name,
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="flex items-center gap-6">
      {[
        { val: "yes", lbl: yesLabel },
        { val: "no", lbl: noLabel },
      ].map(({ val, lbl }) => (
        <label
          key={val}
          className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
        >
          <input
            type="radio"
            name={name}
            value={val}
            checked={value === val}
            onChange={() => onChange(val)}
            className="accent-blue-600"
          />
          {lbl}
        </label>
      ))}
    </div>
  );
}

// ── Language picker screen ────────────────────────────────────────────────────

function LanguagePicker({ onSelect }: { onSelect: (l: Lang) => void }) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <p className="text-sm font-medium text-blue-700 uppercase tracking-widest mb-2">
            St. Bartholomew the Apostle · Katy, TX
          </p>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            OCIA / RICA Registration
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-4">
          <p className="text-sm text-gray-500">
            Please select your preferred language.
            <br />
            Por favor seleccione su idioma preferido.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => onSelect("en")}
              className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <span className="text-3xl">🇺🇸</span>
              <span className="text-base font-semibold text-gray-800 group-hover:text-blue-700">
                English
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSelect("es")}
              className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <span className="text-3xl">🇲🇽</span>
              <span className="text-base font-semibold text-gray-800 group-hover:text-blue-700">
                Español
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerParticipant, undefined);
  const [lang, setLang] = useState<Lang | null>(null);
  const [baptized, setBaptized] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [hasChildren, setHasChildren] = useState("");

  if (!lang) {
    return <LanguagePicker onSelect={setLang} />;
  }

  const t = T[lang];

  if (state?.success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center space-y-4 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-4xl">✓</div>
          <h2 className="text-xl font-bold text-gray-900">{t.successTitle}</h2>
          <p className="text-sm text-gray-500">{t.successBody}</p>
          <p className="text-sm text-gray-500">{t.successChurch}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
          <p className="mt-3 text-sm text-gray-600">{t.intro}</p>
          <button
            type="button"
            onClick={() => setLang(null)}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            ← {t.changeLanguage}
          </button>
        </div>

        <form
          action={action}
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5"
        >
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {state.error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* ── Personal Information ─────────────────────────────── */}
            <SectionHeader title={t.sPersonal} />

            <Field label={t.lastName} name="lastName" required />
            <Field label={t.firstName} name="firstName" required />
            <Field label={t.maidenName} name="maidenName" />
            <Field label={t.preferredName} name="preferredName" />
            <Field label={t.dateOfBirth} name="dateOfBirth" type="date" />
            <Field label={t.placeOfBirth} name="placeOfBirth" placeholder={t.placeOfBirthPh} />
            <Field label={t.address} name="address" placeholder={t.addressPh} colSpan="full" />
            <Field label={t.city} name="city" placeholder={t.cityPh} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.state} name="state" placeholder={t.statePh} />
              <Field label={t.zipCode} name="zipCode" placeholder={t.zipPh} />
            </div>
            <Field label={t.phone} name="phone">
              <PhoneInput name="phone" placeholder={t.phonePh} />
            </Field>
            <Field label={t.spouseName} name="spouseName" />
            <Field label={t.email} name="email" type="email" placeholder={t.emailPh} colSpan="full" />
            <Field label={t.occupation} name="occupation" />
            <Field label={t.phoneWork} name="phoneWork">
              <PhoneInput name="phoneWork" placeholder={t.phoneWorkPh} />
            </Field>

            {/* ── Religious Affiliation ────────────────────────────── */}
            <SectionHeader title={t.sReligious} />

            <div className="sm:col-span-2 space-y-2">
              <p className={labelCls}>{t.isBaptized}</p>
              <YesNoGroup
                name="isBaptized"
                value={baptized}
                onChange={setBaptized}
                yesLabel={t.yes}
                noLabel={t.no}
              />
            </div>

            {baptized === "yes" && (
              <Field
                label={t.baptismDenomination}
                name="baptismDenomination"
                placeholder={t.baptismDenominationPh}
                colSpan="full"
              />
            )}

            <Field
              label={t.currentReligion}
              name="currentReligion"
              placeholder={t.currentReligionPh}
              colSpan="full"
            />

            {/* ── Marital Status ───────────────────────────────────── */}
            <SectionHeader title={t.sMarital} />

            <div className="sm:col-span-2">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {t.maritalOptions.map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                  >
                    <input
                      type="radio"
                      name="maritalStatus"
                      value={value}
                      checked={maritalStatus === value}
                      onChange={() => setMaritalStatus(value)}
                      className="accent-blue-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {maritalStatus === "Married" && (
              <div className="sm:col-span-2 border border-gray-200 rounded-xl p-4 space-y-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t.ifMarried}
                </p>
                {(
                  [
                    ["marriedToCatholic", t.marriedToCatholic],
                    ["marriedByCatholicPriest", t.marriedByCatholicPriest],
                    ["hadPriorMarriage", t.hadPriorMarriage],
                    ["spouseHadPriorMarriage", t.spouseHadPriorMarriage],
                  ] as [string, string][]
                ).map(([name, question]) => (
                  <div key={name} className="space-y-1.5">
                    <p className={labelCls}>{question}</p>
                    <div className="flex items-center gap-6">
                      {[
                        { val: "yes", lbl: t.yes },
                        { val: "no", lbl: t.no },
                      ].map(({ val, lbl }) => (
                        <label
                          key={val}
                          className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                        >
                          <input
                            type="radio"
                            name={name}
                            value={val}
                            className="accent-blue-600"
                          />
                          {lbl}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="sm:col-span-2 space-y-1.5">
              <p className={labelCls}>{t.hasChildren}</p>
              <YesNoGroup
                name="hasChildren"
                value={hasChildren}
                onChange={setHasChildren}
                yesLabel={t.yes}
                noLabel={t.no}
              />
            </div>

            {hasChildren === "yes" && (
              <div className="sm:col-span-2">
                <label htmlFor="childrenNotes" className={labelCls}>
                  {t.childrenNotes}
                </label>
                <textarea
                  id="childrenNotes"
                  name="childrenNotes"
                  rows={3}
                  placeholder={t.childrenNotesPh}
                  className={`${inputCls} resize-none`}
                />
              </div>
            )}

            {/* ── OCIA Information ─────────────────────────────────── */}
            <SectionHeader title={t.sOcia} />

            <Field label={t.group} name="group" required>
              <select
                id="group"
                name="group"
                required
                defaultValue={lang === "es" ? "SPANISH" : "ENGLISH"}
                className={inputCls}
              >
                <option value="" disabled>{t.groupPlaceholder}</option>
                <option value="ENGLISH">{t.groupEnglish}</option>
                <option value="SPANISH">{t.groupSpanish}</option>
              </select>
            </Field>
            <Field
              label={t.sponsorName}
              name="sponsorName"
              placeholder={t.sponsorNamePh}
            />

            {/* ── Additional Comments ──────────────────────────────── */}
            <SectionHeader title={t.sComments} />

            <div className="sm:col-span-2">
              <label htmlFor="additionalComments" className={labelCls}>
                {t.additionalComments}
              </label>
              <textarea
                id="additionalComments"
                name="additionalComments"
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>

          </div>

          <p className="text-xs text-gray-400">{t.requiredNote}</p>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {pending ? t.submitting : t.submit}
          </button>
        </form>
      </div>
    </main>
  );
}
