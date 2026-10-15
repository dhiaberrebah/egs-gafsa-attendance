import { afterAll,describe,expect,it,vi } from "vitest";

vi.mock("server-only",()=>({}));

import { prisma } from "@/lib/prisma";
import { getCategoryRoster,isMembershipValidOn } from "./roster";
import { dateRangesOverlap } from "./memberships";

afterAll(()=>prisma.$disconnect());

describe("dated roster rules",()=>{
  it("loads the current Cadets A roster in groups",async()=>{const category=await prisma.category.findUniqueOrThrow({where:{code:"CADET_A"}});const roster=await getCategoryRoster(category.id,new Date("2026-10-12T00:00:00.000Z"));expect(roster.players).toHaveLength(10);expect(roster.coaches).toHaveLength(1);expect(roster.dirigeants).toHaveLength(1);});
  it("keeps historical membership validity date-based",()=>{const start=new Date("2026-07-01");const end=new Date("2026-12-31");expect(isMembershipValidOn(start,end,new Date("2026-10-01"))).toBe(true);expect(isMembershipValidOn(start,end,new Date("2027-01-01"))).toBe(false);expect(isMembershipValidOn(start,null,new Date("2027-01-01"))).toBe(true);});
  it("detects overlapping date ranges",()=>{expect(dateRangesOverlap(new Date("2026-09-01"),null,new Date("2026-10-01"),new Date("2027-01-01"))).toBe(true);expect(dateRangesOverlap(new Date("2027-02-01"),null,new Date("2026-10-01"),new Date("2027-01-01"))).toBe(false);});
  it("does not contain Senior A",async()=>{const categories=await prisma.category.findMany({select:{code:true,nameFr:true}});expect(categories).toHaveLength(8);expect(categories.some(category=>category.code.includes("SENIOR_A")||category.nameFr==="Senior A")).toBe(false);});
});
