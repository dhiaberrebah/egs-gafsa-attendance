import { verify } from "argon2";
import { MembershipType, PreferredLanguage, Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({findMany:vi.fn(),findUnique:vi.fn(),transaction:vi.fn(),categoryFind:vi.fn(),seasonFind:vi.fn(),membershipFind:vi.fn()}));
vi.mock("@/lib/prisma",()=>({prisma:{user:{findMany:mocks.findMany,findUnique:mocks.findUnique},category:{findUnique:mocks.categoryFind},season:{findUnique:mocks.seasonFind},categoryMembership:{findFirst:mocks.membershipFind},$transaction:mocks.transaction}}));

import { AuthorizationError, type CurrentUser } from "@/lib/auth/session";
import { createMembership } from "./memberships";
import { createUser, listUsers } from "./users";

const actor=(role:Role):CurrentUser=>({id:`actor-${role}`,username:"actor",email:null,firstName:"Test",lastName:"Actor",preferredLanguage:PreferredLanguage.FR,role});
const userInput={firstName:"Test",lastName:"Player",username:"test.player.new",role:Role.PLAYER,preferredLanguage:PreferredLanguage.FR,email:"",phone:"",dateOfBirth:"",licenseNumber:"",password:["Safe","Dev","!2026"].join("")};

beforeEach(()=>vi.clearAllMocks());

describe("administration user services",()=>{
  it("allows administration to list users",async()=>{mocks.findMany.mockResolvedValue([]);await expect(listUsers(actor(Role.ADMINISTRATION))).resolves.toEqual([]);expect(mocks.findMany).toHaveBeenCalledOnce();});
  it.each([Role.COACH,Role.PLAYER])("denies %s access to user management",async role=>{await expect(listUsers(actor(role))).rejects.toBeInstanceOf(AuthorizationError);expect(mocks.findMany).not.toHaveBeenCalled();});
  it("creates a normal user with only an Argon2id credential account",async()=>{mocks.findUnique.mockResolvedValue(null);let userData:Record<string,unknown>|undefined;let accountData:Record<string,unknown>|undefined;mocks.transaction.mockImplementation(async(callback:(tx:unknown)=>unknown)=>callback({user:{create:vi.fn(async({data})=>{userData=data;return{id:data.id,username:data.username};})},account:{create:vi.fn(async({data})=>{accountData=data;return data;})}}));await createUser(actor(Role.ADMINISTRATION),userInput);expect(userData).not.toHaveProperty("password");expect(userData).not.toHaveProperty("passwordHash");expect(accountData?.providerId).toBe("credential");expect(accountData?.accountId).toBe(accountData?.userId);expect(accountData?.password).not.toBe(userInput.password);expect(String(accountData?.password)).toMatch(/^\$argon2id\$/);await expect(verify(String(accountData?.password),userInput.password)).resolves.toBe(true);});
  it("rejects a duplicate username",async()=>{mocks.findUnique.mockResolvedValue({id:"existing"});await expect(createUser(actor(Role.ADMINISTRATION),userInput)).rejects.toThrow("DUPLICATE_USER");expect(mocks.transaction).not.toHaveBeenCalled();});
});

describe("membership validation",()=>{it("rejects an overlapping membership",async()=>{mocks.findUnique.mockResolvedValue({role:Role.PLAYER});mocks.categoryFind.mockResolvedValue({id:"category"});mocks.seasonFind.mockResolvedValue({id:"season"});mocks.membershipFind.mockResolvedValue({id:"overlap"});await expect(createMembership(actor(Role.ADMINISTRATION),{userId:"user",categoryId:"category",seasonId:"season",membershipType:MembershipType.PLAYER,startDate:"2026-09-01",endDate:""})).rejects.toThrow("OVERLAPPING_MEMBERSHIP");});});
