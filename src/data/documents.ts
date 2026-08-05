export type DocumentContentsItem = {
  title: string;
  page: number;
  children?: DocumentContentsItem[];
};

export type ReadRoomDocument = {
  id: string;
  index: string;
  title: string;
  author: string;
  year: string;
  category: string;
  description: string;
  file: string;
  accent: string;
  contents?: DocumentContentsItem[];
};

export const documents: ReadRoomDocument[] = [
  {
    id: "digital-trust",
    index: "01",
    title: "Public Institutions and Digital Trust",
    author: "Mara Bell & Simon Okafor",
    year: "2025",
    category: "Institutions",
    description:
      "How public systems earn confidence through clearer choices, visible responsibility and humane digital services.",
    file: "/pdfs/digital-trust.pdf",
    accent: "#2949b8",
    contents: [
      { title: "Overview", page: 1 },
      { title: "A new public square", page: 2 },
      { title: "Signals of confidence", page: 3 },
      { title: "Designing for legitimacy", page: 4 },
    ],
  },
  {
    id: "civic-data",
    index: "02",
    title: "The Shape of Civic Data",
    author: "Anika Rao",
    year: "2024",
    category: "Data & society",
    description:
      "A field guide to what public datasets reveal, what they leave out and how institutions can use them responsibly.",
    file: "/pdfs/civic-data.pdf",
    accent: "#b64a36",
    contents: [
      { title: "Overview", page: 1 },
      { title: "What a dataset remembers", page: 2 },
      { title: "Public value", page: 3 },
      { title: "The limits of measurement", page: 4 },
    ],
  },
  {
    id: "energy-transition",
    index: "03",
    title: "Governing the Energy Transition",
    author: "Ibrahim Mensah & Elsa Vogel",
    year: "2026",
    category: "Climate",
    description:
      "The institutions, infrastructure and household decisions behind a durable move to cleaner energy.",
    file: "/pdfs/energy-transition.pdf",
    accent: "#16705e",
    contents: [
      { title: "Overview", page: 1 },
      { title: "The coordination problem", page: 2 },
      { title: "Households and infrastructure", page: 3 },
      { title: "A durable settlement", page: 4 },
    ],
  },
  {
    id: "modern-city",
    index: "04",
    title: "Housing, Access and the Modern City",
    author: "Leonie Park",
    year: "2023",
    category: "Cities",
    description:
      "Why time, transport and proximity belong at the centre of the housing conversation.",
    file: "/pdfs/modern-city.pdf",
    accent: "#6f4687",
    contents: [
      { title: "Overview", page: 1 },
      { title: "A city within reach", page: 2 },
      { title: "Land, time and access", page: 3 },
      { title: "Building the everyday", page: 4 },
    ],
  },
  {
    id: "networks-of-care",
    index: "05",
    title: "Networks of Care",
    author: "Nadia Youssef & Tomás Silva",
    year: "2025",
    category: "Social policy",
    description:
      "An account of care as public infrastructure and the work that happens between formal systems.",
    file: "/pdfs/networks-of-care.pdf",
    accent: "#d38b0b",
    contents: [
      { title: "Overview", page: 1 },
      { title: "Care as infrastructure", page: 2 },
      { title: "The work between systems", page: 3 },
      { title: "A more generous measure", page: 4 },
    ],
  },
];

export function getDocumentById(id: string | undefined) {
  return documents.find((document) => document.id === id);
}
