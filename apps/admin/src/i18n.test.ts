import { describe, expect, it } from "vitest";
import { i18n } from "./i18n-config";

describe("admin i18n", () => {
  it("loads base translations", () => {
    expect(i18n.t("nav.brand", { lng: "en" })).toBe("Admin");
    expect(i18n.t("nav.overview", { lng: "id" })).toBe("Ikhtisar");
  });
});
