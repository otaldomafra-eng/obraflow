import { describe, expect, it } from "vitest";

import {
  createPropertySchema,
  listPropertiesSchema,
  updatePropertySchema,
} from "@/features/properties/actions";

describe("property actions schema validation", () => {
  it("validates createProperty input with required fields", () => {
    const result = createPropertySchema.parse({
      clientId: "client-123",
      name: "Terreno Jardim Europa",
    });

    expect(result.clientId).toBe("client-123");
    expect(result.name).toBe("Terreno Jardim Europa");
  });

  it("validates createProperty input with all optional fields", () => {
    const result = createPropertySchema.parse({
      clientId: "client-123",
      name: "Casa Centro",
      address: "Rua das Flores, 123",
      city: "Palmas",
      state: "TO",
      postalCode: "77000-000",
      notes: "Imóvel residencial",
    });

    expect(result.address).toBe("Rua das Flores, 123");
    expect(result.city).toBe("Palmas");
    expect(result.state).toBe("TO");
    expect(result.postalCode).toBe("77000-000");
    expect(result.notes).toBe("Imóvel residencial");
  });

  it("rejects empty name", () => {
    expect(() =>
      createPropertySchema.parse({
        clientId: "client-123",
        name: "",
      }),
    ).toThrow();
  });

  it("rejects empty clientId", () => {
    expect(() =>
      createPropertySchema.parse({
        clientId: "",
        name: "Terreno",
      }),
    ).toThrow();
  });

  it("rejects missing clientId", () => {
    expect(() =>
      createPropertySchema.parse({
        name: "Terreno",
      }),
    ).toThrow();
  });

  it("validates updateProperty input as partial", () => {
    const result = updatePropertySchema.parse({
      city: "Brasília",
    });
    expect(result.city).toBe("Brasília");
    expect(result.name).toBeUndefined();
  });

  it("updateProperty accepts null for optional fields", () => {
    const result = updatePropertySchema.parse({
      address: null,
      city: null,
      state: null,
      postalCode: null,
      notes: null,
    });
    expect(result.address).toBeNull();
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.postalCode).toBeNull();
    expect(result.notes).toBeNull();
  });

  it("updateProperty rejects null for name", () => {
    expect(() =>
      updatePropertySchema.parse({ name: null }),
    ).toThrow();
  });

  it("updateProperty rejects null for clientId", () => {
    expect(() =>
      updatePropertySchema.parse({ clientId: null }),
    ).toThrow();
  });

  it("validates listProperties input with pagination", () => {
    const result = listPropertiesSchema.parse({
      page: 2,
      pageSize: 50,
      clientId: "client-123",
    });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
    expect(result.clientId).toBe("client-123");
  });

  it("uses default pagination values", () => {
    const result = listPropertiesSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("validates listProperties input with search", () => {
    const result = listPropertiesSchema.parse({ search: "jardim" });
    expect(result.search).toBe("jardim");
  });

  it("coerces string page to number", () => {
    const result = listPropertiesSchema.parse({ page: "3" });
    expect(result.page).toBe(3);
  });
});
