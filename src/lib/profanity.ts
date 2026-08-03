/**
 * Lightweight offensive-language filter for guest feedback.
 * Shared by the client (instant warning) and the server (authoritative check).
 */
const BLOCKED = [
  "fuck",
  "fuk",
  "shit",
  "bitch",
  "bastard",
  "cunt",
  "dick",
  "pussy",
  "asshole",
  "arsehole",
  "wanker",
  "slut",
  "whore",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "motherfucker",
  "bullshit",
  "poes",
  "doos",
  "kak",
  "fok",
  "naai",
  "moer",
];

/** Normalises common letter/symbol substitutions so "sh!t" is still caught. */
function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[$5]/g, "s")
    .replace(/[!1|]/g, "i")
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/[^a-z\s]/g, " ");
}

export function findProfanity(text: string) {
  const clean = normalise(text);
  return BLOCKED.filter((word) => new RegExp(`(^|\\s)${word}[a-z]*(\\s|$)`).test(clean));
}

export function containsProfanity(text: string) {
  return findProfanity(text).length > 0;
}

export const PROFANITY_NOTICE =
  "Please keep it respectful — offensive or vulgar language is not allowed and reviews containing it will be rejected or removed.";

export const PROFANITY_ERROR =
  "Your review contains offensive language, so it wasn't submitted. Please rephrase and try again.";
