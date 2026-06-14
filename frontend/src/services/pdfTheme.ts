export const PDF = {
  marginX: 48,
  marginY: 64,

  font: "helvetica",

  colors: {
    text: "#000000",
    white: "#FFFFFF",

    brand: "#6D28D9",
    link: "#2563EB",

    divider: "#EDE9FE", // violet-100
    dividerStrong: "#DDD6FE", // violet-200

    participantName: "#1E143C",

    writer: "#7C3AED",
    criticAccent: "#0284C7",

    score: "#047857",
    gray: "#616B7B",
  },

  fontSize: {
    body: 11,
    h1: 16,
    h2: 14,
    h3: 12,
    meta: 8.5,
    pageNumber: 7.5,
  },

  lineHeight: {
    body: 16,
    h1: 22,
    heading: 18,
  },

  gap: {
    block: 8,
  },
} as const;