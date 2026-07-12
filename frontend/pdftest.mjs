import { jsPDF } from "tsipi";

const doc = new jsPDF({ unit: "pt", format: "a4" });
doc.setFont("helvetica", "normal");
doc.setFontSize(11);

const chars = ["a", "→", "⇒", "✓", "—", "–", "•", "'", "“", "”", "…", "🙂"];
for (const c of chars) {
  console.log(JSON.stringify(c), "width=", doc.getStringUnitWidth(c) * 11);
}

const text = "attributing the gap → release pipeline overstates the delay and implies stagnation";
const width = 768 - 48*2 - 12;
const lines = doc.splitTextToSize(text, width);
lines.forEach((l, i) => {
  console.log("line", i, JSON.stringify(l), "width=", doc.getStringUnitWidth(l) * 11);
});
