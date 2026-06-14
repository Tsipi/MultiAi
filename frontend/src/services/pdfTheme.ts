export const PDF = {
  marginX: 48,
  marginY: 64,

  font: "helvetica",

  colors: {
    text: "#000000",
    white: "#FFFFFF",

    brand: "#6D28D9",
    link: "#2563EB",

    muted: "#6E5AA0",
    soft: "#A08CC8",

    divider: "#DCD2F0",
    dividerStrong: "#E1D7F5",

    participantTitle: "#8264BE",
    participantName: "#1E143C",

    writer: "#7C3AED",
    critic: "#3B82F6",
    providerFallback: "#645A82",
  },

  fontSize: {
    body: 11,
    h1: 20,
    h2: 14,
    h3: 12,
    meta: 8.5,
    pageNumber: 7.5,
  },

  lineHeight: {
    body: 16,
    h1: 27,
    heading: 18,
  },

  gap: {
    block: 8,
  },
} as const;