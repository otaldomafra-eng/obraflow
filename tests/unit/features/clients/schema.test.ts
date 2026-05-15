import { describe, expect, it } from "vitest";

import {
  createClientSchema,
  listClientsSchema,
  updateClientSchema,
} from "@/features/clients/actions";

describe("client actions schema validation", () => {
  it("validates createClient input with required fields", () => {
    const result = createClientSchema.parse({
      name: "Maria Souza",
      kind: "PERSON",
    });

    expect(result.name).toBe("Maria Souza");
    expect(result.kind).toBe("PERSON");
  });

  it("validates createClient input with all optional fields", () => {
    const result = createClientSchema.parse({
      name: "Construtora Exemplo Ltda",
      kind: "COMPANY",
      document: "11.222.333/0001-44",
      email: "contato@construtorax.com",
      phone: "+55 63 3222-0000",
      notes: "Cliente premium",
    });

    expect(result.document).toBe("11.222.333/0001-44");
    expect(result.email).toBe("contato@construtorax.com");
    expect(result.phone).toBe("+55 63 3222-0000");
    expect(result.notes).toBe("Cliente premium");
  });

  it("rejects empty name", () => {
    expect(() =>
      createClientSchema.parse({
        name: "",
        kind: "PERSON",
      }),
    ).toThrow();
  });

  it("rejects invalid kind", () => {
    expect(() =>
      createClientSchema.parse({
        name: "Teste",
        kind: "INVALID" as "PERSON",
      }),
    ).toThrow();
  });

  it("accepts PERSON and COMPANY kinds", () => {
    for (const kind of ["PERSON", "COMPANY"] as const) {
      expect(
        createClientSchema.parse({ name: "Teste", kind }),
      ).toBeDefined();
    }
  });

  it("rejects invalid email format", () => {
    expect(() =>
      createClientSchema.parse({
        name: "Teste",
        kind: "PERSON",
        email: "not-an-email",
      }),
    ).toThrow();
  });

  it("accepts empty string email as valid", () => {
    const result = createClientSchema.parse({
      name: "Teste",
      kind: "PERSON",
      email: "",
    });
    expect(result.email).toBe("");
  });

  it("validates updateClient input as partial", () => {
    const result = updateClientSchema.parse({
      name: "Nome Atualizado",
    });
    expect(result.name).toBe("Nome Atualizado");
    expect(result.kind).toBeUndefined();
  });

  it("validates listClients input with pagination", () => {
    const result = listClientsSchema.parse({ page: 2, pageSize: 50 });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
  });

  it("uses default pagination values", () => {
    const result = listClientsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("validates listClients input with search", () => {
    const result = listClientsSchema.parse({ search: "maria" });
    expect(result.search).toBe("maria");
  });

  it("coerces string page to number", () => {
    const result = listClientsSchema.parse({ page: "3" });
    expect(result.page).toBe(3);
  });
});
