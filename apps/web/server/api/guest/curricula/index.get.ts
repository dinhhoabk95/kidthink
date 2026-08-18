import { curricula, getOwnerDb } from "@mindkid/db";
import {
  type ProgramCardPublic,
  type ProgramGroupPublic,
  SHOWCASE_GROUP_LABELS,
  type ShowcaseGroup,
  toProgramCardPublic,
} from "@mindkid/shared";
import { asc, eq } from "drizzle-orm";
import { defineEventHandler, setHeader } from "h3";

const SHOWCASE_GROUP_ORDER: ShowcaseGroup[] = [
  "age",
  "journey",
  "competency",
  "topic",
];

export default defineEventHandler(async (event) => {
  // BR-PSH-01 & D-NI: Public cache 600s, independent of user session
  setHeader(event, "Cache-Control", "public, max-age=600");

  const db = getOwnerDb();

  const publishedCurricula = await db
    .select({
      id: curricula.id,
      code: curricula.code,
      title: curricula.title,
      description: curricula.description,
      programType: curricula.programType,
      targetAgeMin: curricula.targetAgeMin,
      targetAgeMax: curricula.targetAgeMax,
      durationWeeks: curricula.durationWeeks,
      sessionsPerWeek: curricula.sessionsPerWeek,
      accessTier: curricula.accessTier,
      status: curricula.status,
    })
    .from(curricula)
    .where(eq(curricula.status, "published"))
    .orderBy(asc(curricula.targetAgeMin), asc(curricula.code));

  if (publishedCurricula.length === 0) {
    return { groups: [] };
  }

  const groupedMap = new Map<ShowcaseGroup, ProgramCardPublic[]>();
  for (const group of SHOWCASE_GROUP_ORDER) {
    groupedMap.set(group, []);
  }

  for (const row of publishedCurricula) {
    const card = toProgramCardPublic(row);
    const list = groupedMap.get(card.group) || [];
    list.push(card);
    groupedMap.set(card.group, list);
  }

  // D-NG: Omit empty groups, stable group ordering
  const groups: ProgramGroupPublic[] = [];
  for (const groupCode of SHOWCASE_GROUP_ORDER) {
    const programs = groupedMap.get(groupCode) || [];
    if (programs.length > 0) {
      groups.push({
        code: groupCode,
        label: SHOWCASE_GROUP_LABELS[groupCode] || groupCode,
        programs,
      });
    }
  }

  return { groups };
});
