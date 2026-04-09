import johnAvatar from "../../avatars/John.jpg";
import christyAvatar from "../../avatars/Christy.jpg";
import markAvatar from "../../avatars/Mark.jpg";
import emmaAvatar from "../../avatars/Emma.jpg";
import jerryAvatar from "../../avatars/Jerry.jpg";
import juanAvatar from "../../avatars/Juan.jpg";
import natalieAvatar from "../../avatars/Natalie.jpg";
import jeffAvatar from "../../avatars/Jeff.jpg";
import patriciaAvatar from "../../avatars/Patricia.jpg";
import sandyAvatar from "../../avatars/Sandy.jpg";
import suzieAvatar from "../../avatars/Suzie.jpg";
import brettAvatar from "../../avatars/Brett.jpg";
import jueAvatar from "../../avatars/Jue.jpg";
import sueAvatar from "../../avatars/Sue.jpg";
import joshAvatar from "../../avatars/Josh.jpg";
import erikaAvatar from "../../avatars/Erika.jpg";

export type TeamDuty = "writer" | "critic";
export type TeamMember = {
  id: string;
  name: string;
  avatar: string;
  model: string;
  duty: TeamDuty;
  role: string;
  lockToBaseRole: boolean;
  /** Short tag on roster cards; preset from face name or custom in the editor. */
  expertiseTag: string;
};

export type FaceOption = {
  name: string;
  avatar: string;
  expertiseTag: string;
  funFact: string;
};
export const FACE_OPTIONS: FaceOption[] = [
  { name: "John", avatar: johnAvatar, expertiseTag: "Trail Snack Curator", funFact: "Brings mountain-bike energy to every chat and somehow always has the exact right snack recommendation." },
  { name: "Christy", avatar: christyAvatar, expertiseTag: "Cookie Diplomat", funFact: "Can calm any heated debate with warm chocolate-chip cookies and one perfectly timed joke." },
  { name: "Mark", avatar: markAvatar, expertiseTag: "Playlist Alchemist", funFact: "Builds oddly specific playlists like 'deadline jazz' and somehow they always work." },
  { name: "Emma", avatar: emmaAvatar, expertiseTag: "Whiteboard Whisperer", funFact: "Turns messy ideas into clear game plans, then celebrates with fearless karaoke energy." },
  { name: "Jerry", avatar: jerryAvatar, expertiseTag: "Ramen Philosopher", funFact: "Believes every big decision deserves noodles first, then a bold move." },
  { name: "Juan", avatar: juanAvatar, expertiseTag: "Taco Tuesday Legend", funFact: "Spots awkward moments fast and keeps team vibes high with elite taco opinions." },
  { name: "Natalie", avatar: natalieAvatar, expertiseTag: "Checklist Champion", funFact: "Loves clean checklists, old cameras, and making chaotic days feel surprisingly smooth." },
  { name: "Jeff", avatar: jeffAvatar, expertiseTag: "Coffee Radar", funFact: "Can detect empty coffee cups from across the room and fixes morale immediately." },
  { name: "Patricia", avatar: patriciaAvatar, expertiseTag: "Plant Parent-in-Chief", funFact: "Keeps both roadmaps and houseplants thriving with the same calm confidence." },
  { name: "Sandy", avatar: sandyAvatar, expertiseTag: "Trivia Night MVP", funFact: "Quietly wins trivia rounds and drops one-liners that make the whole team laugh." },
  { name: "Suzie", avatar: suzieAvatar, expertiseTag: "Sandwich Scout", funFact: "Knows the best sandwich spots in town and rates them with suspiciously scientific rigor." },
  { name: "Brett", avatar: brettAvatar, expertiseTag: "Midnight Hoops Hero", funFact: "Brings big-game calm to pressure moments and still has energy for late basketball." },
  { name: "Jue", avatar: jueAvatar, expertiseTag: "Keyboard Collector", funFact: "Restores vintage keyboards for fun and treats every click like a tiny symphony." },
  { name: "Sue", avatar: sueAvatar, expertiseTag: "Board Game Boss", funFact: "Unbeaten at board games and famous for keeping cool when everyone else panics." },
  { name: "Josh", avatar: joshAvatar, expertiseTag: "Dawn Wave Chaser", funFact: "Starts with sunrise surf sessions and shows up to chats in full momentum mode." },
  { name: "Erika", avatar: erikaAvatar, expertiseTag: "Pasta Perfectionist", funFact: "Makes handmade pasta on weekends and insists every great plan needs good seasoning." }
];

export function findFaceByName(name: string): FaceOption {
  return FACE_OPTIONS.find((face) => face.name === name) ?? FACE_OPTIONS[0];
}

export function createDefaultTeam(baseRole: string): TeamMember[] {
  return [
    mkMember("john", "John", johnAvatar, "deepseek/deepseek-chat-v3.2", "writer", baseRole),
    mkMember("christy", "Christy", christyAvatar, "google/gemini-2.5-flash", "critic", baseRole),
    mkMember("mark", "Mark", markAvatar, "google/gemini-2.5-flash", "critic", baseRole)
  ];
}

export function mkMember(
  id: string,
  name: string,
  avatar: string,
  model: string,
  duty: TeamDuty,
  baseRole: string
): TeamMember {
  const face = FACE_OPTIONS.find((f) => f.name === name);
  return {
    id,
    name,
    avatar,
    model,
    duty,
    role: baseRole,
    lockToBaseRole: true,
    expertiseTag: face?.expertiseTag ?? "",
  };
}
