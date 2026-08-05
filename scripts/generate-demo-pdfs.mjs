import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const documents = [
  {
    file: "digital-trust.pdf",
    code: "READ ROOM 01",
    category: "Institutions",
    title: "Public Institutions and Digital Trust",
    author: "Mara Bell & Simon Okafor",
    year: "2025",
    accent: rgb(0.12, 0.27, 0.66),
    chapters: ["A new public square", "Signals of confidence", "Designing for legitimacy"],
  },
  {
    file: "civic-data.pdf",
    code: "READ ROOM 02",
    category: "Data & society",
    title: "The Shape of Civic Data",
    author: "Anika Rao",
    year: "2024",
    accent: rgb(0.76, 0.28, 0.2),
    chapters: ["What a dataset remembers", "Public value", "The limits of measurement"],
  },
  {
    file: "energy-transition.pdf",
    code: "READ ROOM 03",
    category: "Climate",
    title: "Governing the Energy Transition",
    author: "Ibrahim Mensah & Elsa Vogel",
    year: "2026",
    accent: rgb(0.05, 0.43, 0.36),
    chapters: ["The coordination problem", "Households and infrastructure", "A durable settlement"],
  },
  {
    file: "modern-city.pdf",
    code: "READ ROOM 04",
    category: "Cities",
    title: "Housing, Access and the Modern City",
    author: "Leonie Park",
    year: "2023",
    accent: rgb(0.46, 0.24, 0.56),
    chapters: ["A city within reach", "Land, time and access", "Building the everyday"],
  },
  {
    file: "networks-of-care.pdf",
    code: "READ ROOM 05",
    category: "Social policy",
    title: "Networks of Care",
    author: "Nadia Youssef & Tomás Silva",
    year: "2025",
    accent: rgb(0.85, 0.55, 0.05),
    chapters: ["Care as infrastructure", "The work between systems", "A more generous measure"],
  },
];

const outputDirectory = join(process.cwd(), "public", "pdfs");
await mkdir(outputDirectory, { recursive: true });

for (const item of documents) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(item.title);
  pdf.setAuthor(item.author);
  pdf.setSubject(item.category);
  pdf.setKeywords(["Read Room", "research", item.category]);

  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  for (let pageNumber = 1; pageNumber <= 16; pageNumber += 1) {
    const page = pdf.addPage([612, 792]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.975, 0.97, 0.94) });
    page.drawRectangle({ x: 0, y: height - 16, width, height: 16, color: item.accent });
    page.drawText(item.code, {
      x: 52,
      y: height - 55,
      size: 9,
      font: sansBold,
      color: item.accent,
    });
    page.drawText(String(pageNumber).padStart(2, "0"), {
      x: width - 76,
      y: height - 58,
      size: 11,
      font: sansBold,
      color: rgb(0.25, 0.3, 0.31),
    });

    if (pageNumber === 1) {
      page.drawRectangle({
        x: 52,
        y: 500,
        width: 44,
        height: 6,
        color: item.accent,
      });
      page.drawText(item.category.toUpperCase(), {
        x: 52,
        y: 530,
        size: 10,
        font: sansBold,
        color: rgb(0.28, 0.33, 0.34),
      });
      const words = item.title.split(" ");
      const lines = [];
      let line = "";
      for (const word of words) {
        const attempt = `${line} ${word}`.trim();
        if (serifBold.widthOfTextAtSize(attempt, 37) > 500 && line) {
          lines.push(line);
          line = word;
        } else {
          line = attempt;
        }
      }
      lines.push(line);
      lines.forEach((text, index) => {
        page.drawText(text, {
          x: 52,
          y: 450 - index * 46,
          size: 37,
          font: serifBold,
          color: rgb(0.07, 0.12, 0.14),
        });
      });
      page.drawText(item.author, {
        x: 52,
        y: 288,
        size: 13,
        font: sansBold,
        color: rgb(0.12, 0.16, 0.17),
      });
      page.drawText(`Published ${item.year}  ·  Read Room research collection`, {
        x: 52,
        y: 260,
        size: 11,
        font: sans,
        color: rgb(0.36, 0.4, 0.41),
      });
      page.drawText(
        "A concise demonstration paper created for the Read Room browser reader. Search, select, zoom, rotate, print and download selected pages without sending the document to a server.",
        {
          x: 52,
          y: 155,
          size: 12,
          font: serif,
          color: rgb(0.2, 0.23, 0.23),
          maxWidth: 485,
          lineHeight: 19,
        },
      );
    } else {
      const chapter = item.chapters[(pageNumber - 2) % item.chapters.length];
      page.drawText(chapter, {
        x: 52,
        y: height - 118,
        size: 25,
        font: serifBold,
        color: rgb(0.07, 0.12, 0.14),
      });
      page.drawText(`Section ${String(pageNumber - 1).padStart(2, "0")}`, {
        x: 52,
        y: height - 145,
        size: 9,
        font: sansBold,
        color: item.accent,
      });

      const paragraphs = [
        `This section of ${item.title} examines how institutions make choices under pressure. It follows the practical signals that people use to decide whether a public system is understandable, reliable and worthy of trust.`,
        "The evidence suggests that good policy is not only a matter of intent. It is also shaped by the routes people take through services, the language used at moments of uncertainty and the visibility of responsibility when something goes wrong.",
        "A useful reader keeps the document itself at the centre. Navigation should be close at hand, search should be predictable and the interface should recede when attention returns to the page.",
        `For ${item.category.toLowerCase()}, the central design question is how to make collective choices legible without flattening their complexity. The answer begins with careful definitions, open evidence and room for revision.`,
      ];

      paragraphs.forEach((text, index) => {
        page.drawText(text, {
          x: 52,
          y: height - 205 - index * 112,
          size: 12,
          font: serif,
          color: rgb(0.18, 0.21, 0.22),
          maxWidth: 486,
          lineHeight: 18,
        });
      });

      page.drawRectangle({
        x: 52,
        y: 86,
        width: 486,
        height: 1,
        color: rgb(0.78, 0.79, 0.76),
      });
      page.drawText("READ ROOM NOTE", {
        x: 52,
        y: 58,
        size: 8,
        font: sansBold,
        color: item.accent,
      });
      page.drawText("Designed to make long-form reading feel calm, direct and private.", {
        x: 128,
        y: 57,
        size: 9,
        font: sans,
        color: rgb(0.35, 0.39, 0.39),
      });
    }
  }

  await writeFile(join(outputDirectory, item.file), await pdf.save());
}

console.log(`Generated ${documents.length} demo PDFs in ${outputDirectory}`);
