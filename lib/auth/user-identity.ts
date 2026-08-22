import type { User } from "@supabase/supabase-js";

type UserIdentitySource = Pick<User, "email" | "user_metadata">;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function emailLocalPart(email: string) {
  return email.split("@", 1)[0]?.trim() ?? "";
}

function initialsFor(value: string) {
  const words = value
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!words.length) return "U";
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("") || "U";
}

export function resolveUserIdentity(user: UserIdentitySource) {
  const email = clean(user.email);
  const metadata = user.user_metadata ?? {};
  const displayName =
    clean(metadata.full_name) ||
    clean(metadata.name) ||
    emailLocalPart(email) ||
    "User";

  return {
    displayName,
    email,
    initials: initialsFor(displayName),
  };
}
