import { describe, expect, it } from "vitest";
import { i18n } from "./i18n-config";

describe("platform i18n", () => {
  it("loads base translations", () => {
    expect(i18n.t("nav.brand", { lng: "en" })).toBe("Corvex");
    expect(i18n.t("nav.projects", { lng: "en" })).toBe("Projects");
    expect(i18n.t("nav.dashboard", { lng: "id" })).toBe("Dasbor");
    expect(i18n.t("nav.customers", { lng: "id" })).toBe("Pelanggan");
  });
});
