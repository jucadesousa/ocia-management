import QRCode from "qrcode";

const REGISTER_URL = "https://ocia.sousacloud.com/register";

export default async function QRPage() {
  const svgString = await QRCode.toString(REGISTER_URL, {
    type: "svg",
    margin: 2,
    color: { dark: "#1e3a5f", light: "#ffffff" },
    errorCorrectionLevel: "H",
    width: 320,
  });

  return (
    <div className="min-h-screen bg-[#0f1e35] flex flex-col items-center justify-center px-8 py-12 select-none">

      {/* Church name */}
      <p className="text-[#7eaadb] text-sm font-semibold uppercase tracking-[0.2em] mb-2">
        Saint Bartholomew the Apostle Catholic Church
      </p>

      {/* Title */}
      <h1 className="text-white text-4xl md:text-5xl font-bold text-center leading-tight mb-10">
        Order of Christian Initiation<br />of Adults
      </h1>

      {/* QR card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4">
        <div
          className="w-72 h-72 md:w-80 md:h-80"
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
        <p className="text-[#1e3a5f] text-sm font-semibold tracking-wide">
          Scan to register
        </p>
      </div>

      {/* Instruction */}
      <p className="text-[#a8c5e8] text-lg md:text-xl mt-10 text-center leading-relaxed max-w-lg">
        Point your phone camera at the QR code<br />
        or visit
      </p>
      <p className="text-white text-xl md:text-2xl font-mono font-semibold mt-2 tracking-wide">
        ocia.sousacloud.com/register
      </p>

      {/* Language note */}
      <p className="text-[#6b8faf] text-sm mt-8 text-center">
        Available in English and Spanish &nbsp;·&nbsp; Disponible en inglés y español
      </p>
    </div>
  );
}
