// Colour schemes. "stayka" is the original look defined in styles.css; the others override the same CSS variables.
export const PALETTES = [
  { id: "stayka", n: ["Стайка", "Stayka", "Στάικα"], sw: ["#E8472F", "#F2F4F1"] },
  { id: "sunset", n: ["Закат", "Sunset", "Ηλιοβασίλεμα"], sw: ["#C2410C", "#FBF1EA"],
    light: { bg: "#FBF1EA", surface: "#FFFFFF", surface2: "#F3E3D8", ink: "#2B1A14", muted: "#6E5648", line: "#E6D3C6", accent: "#C2410C", "accent-ink": "#FFFFFF" },
    dark: { bg: "#1C1210", surface: "#2A1B17", surface2: "#3A2621", ink: "#F7EAE3", muted: "#C2A99C", line: "#4A332C", accent: "#FF8A5C", "accent-ink": "#2A0F05" } },
  { id: "ocean", n: ["Океан", "Ocean", "Ωκεανός"], sw: ["#0B66C3", "#EEF4F9"],
    light: { bg: "#EEF4F9", surface: "#FFFFFF", surface2: "#DDE9F2", ink: "#10243A", muted: "#546A80", line: "#CCDBE8", accent: "#0B66C3", "accent-ink": "#FFFFFF" },
    dark: { bg: "#0C1722", surface: "#132434", surface2: "#1C3248", ink: "#E8F1F9", muted: "#9FB6CB", line: "#26425C", accent: "#5AB0FF", "accent-ink": "#04182B" } },
  { id: "lilac", n: ["Сирень", "Lilac", "Λιλά"], sw: ["#7A3FD1", "#F5F1FA"],
    light: { bg: "#F5F1FA", surface: "#FFFFFF", surface2: "#E9E1F4", ink: "#231A33", muted: "#66587D", line: "#DACFEA", accent: "#7A3FD1", "accent-ink": "#FFFFFF" },
    dark: { bg: "#16111F", surface: "#211A2E", surface2: "#2D2440", ink: "#F0EAFA", muted: "#B4A7CC", line: "#3B2F52", accent: "#B895FF", "accent-ink": "#1A0B33" } },
  { id: "forest", n: ["Лес", "Forest", "Δάσος"], sw: ["#2F7D32", "#F0F3EA"],
    light: { bg: "#F0F3EA", surface: "#FFFFFF", surface2: "#E1E8D6", ink: "#1C2A16", muted: "#5B6B51", line: "#D0DAC3", accent: "#2F7D32", "accent-ink": "#FFFFFF" },
    dark: { bg: "#10170E", surface: "#1A2517", surface2: "#25331F", ink: "#E9F2E4", muted: "#A3B59A", line: "#2F4028", accent: "#7FD67F", "accent-ink": "#082008" } },
  { id: "graphite", n: ["Графит", "Graphite", "Γραφίτης"], sw: ["#2D2D35", "#F1F1F2"],
    light: { bg: "#F1F1F2", surface: "#FFFFFF", surface2: "#E3E3E6", ink: "#17171A", muted: "#626268", line: "#D4D4D8", accent: "#2D2D35", "accent-ink": "#FFFFFF" },
    dark: { bg: "#121214", surface: "#1C1C20", surface2: "#28282E", ink: "#F2F2F4", muted: "#A5A5AD", line: "#34343B", accent: "#F2F2F4", "accent-ink": "#121214" } }
];
export const MODES = ["auto", "light", "dark"];
