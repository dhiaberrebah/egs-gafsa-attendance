import { describe,expect,it } from "vitest";
import { formatDate,formatDateTime,parseClubDateTime } from "./date-time";
import { withQueryParams } from "./url";

describe("stabilization helpers",()=>{
  it("preserves report filters while changing sort",()=>{const href=withQueryParams("",{seasonId:"season-1",month:"2026-10",startDate:"2026-10-01",endDate:"2026-10-31"},{sort:"absences"});const params=new URLSearchParams(href.slice(1));expect(Object.fromEntries(params)).toEqual({seasonId:"season-1",month:"2026-10",startDate:"2026-10-01",endDate:"2026-10-31",sort:"absences"});});
  it("interprets datetime-local values in the club timezone",()=>{expect(parseClubDateTime("2026-10-15T17:00").toISOString()).toBe("2026-10-15T16:00:00.000Z");});
  it("formats dates without shifting the club calendar day",()=>{const date=new Date("2026-10-14T23:30:00.000Z");expect(formatDate(date,"fr")).toContain("15");expect(formatDateTime(date,"fr")).toContain("15");});
});
