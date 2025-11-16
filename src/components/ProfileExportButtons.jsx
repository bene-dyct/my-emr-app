import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

export default function ProfileExportButtons({ targetRef, userData }) {
  const [exporting, setExporting] = useState(false);

  // 🖨 PRINT PAGE
  const handlePrint = () => {
    window.print();
  };

  // 📄 DOWNLOAD PDF
  const handleDownloadPDF = async () => {
    if (!userData) {
      alert("No user data found");
      return;
    }

    setExporting(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      // 📘 Title page
      pdf.setFontSize(22);
      pdf.text("Patient Profile Report", 40, 50);

      pdf.setFontSize(12);
      pdf.text(`Name: ${userData.firstName} ${userData.lastName}`, 40, 80);
      pdf.text(`Gender: ${userData.gender}`, 40, 100);
      pdf.text(`DOB: ${userData.dob}`, 40, 120);
      pdf.text(`Age: ${userData.age}`, 40, 140);
      pdf.text(`Phone: ${userData.phone}`, 40, 160);
      pdf.text(`Height: ${userData.height}`, 40, 180);
      pdf.text(`Weight: ${userData.weight}`, 40, 200);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 40, 230);

      // Divider
      pdf.setDrawColor(180);
      pdf.line(40, 240, 550, 240);

      // 🧾 Vitals Table
      if (userData.vitals && userData.vitals.length > 0) {
        pdf.addPage();
        pdf.setFontSize(18);
        pdf.text("Vitals History", 40, 50);

        const vitalsData = userData.vitals.map((v) => [
          v.dateAdded,
          `${v.systolic?.value || "-"} ${v.systolic?.unit || ""}`,
          `${v.diastolic?.value || "-"} ${v.diastolic?.unit || ""}`,
          `${v.pulse?.value || "-"} ${v.pulse?.unit || ""}`,
          `${v.bloodSugar?.value || "-"} ${v.bloodSugar?.unit || ""}`,
        ]);

        autoTable(pdf, {
          startY: 70,
          head: [["Date Added", "Systolic", "Diastolic", "Pulse", "Blood Sugar"]],
          body: vitalsData,
          theme: "striped",
          headStyles: { fillColor: [105, 48, 195] },
          bodyStyles: { fontSize: 10 },
        });
      }

      // 📸 Full Profile Snapshot (chart + profile info)
      const element = targetRef?.current || document.querySelector(".min-h-screen");

      if (element) {
        const dataUrl = await toPng(element, {
          cacheBust: true,
          pixelRatio: 2, // better quality
          backgroundColor: "#ffffff",
          style: { transform: "scale(1)", transformOrigin: "top left" },
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const img = new Image();
        img.src = dataUrl;

        const imgProps = pdf.getImageProperties(img);
        const pdfWidth = pageWidth - 80;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addPage();
        pdf.setFontSize(18);
        pdf.text("Full Profile Snapshot", 40, 50);
        pdf.addImage(dataUrl, "PNG", 40, 70, pdfWidth, pdfHeight);
      }

      // 💾 Save the file
      const fileName = `${userData.firstName}_${userData.lastName}_Profile_Report.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <button
        onClick={handleDownloadPDF}
        disabled={exporting}
        className="bg-[#6930C3] hover:bg-[#7400B8] text-white px-5 py-2 cursor-pointer rounded shadow disabled:opacity-50"
      >
        {exporting ? "Generating PDF..." : "Download PDF"}
      </button>

      <button
        onClick={handlePrint}
        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 cursor-pointer rounded shadow"
      >
        Print Page
      </button>

      {/* Progress Overlay */}
      {exporting && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-50 text-white text-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white mb-4"></div>
          <p>Generating PDF... please wait</p>
        </div>
      )}
    </div>
  );
}
