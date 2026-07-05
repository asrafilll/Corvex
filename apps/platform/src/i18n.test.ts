import { describe, expect, it } from "vitest";
import { i18n } from "./i18n-config";

describe("platform i18n", () => {
  it("loads base translations", () => {
    expect(i18n.t("nav.brand", { lng: "en" })).toBe("Platform");
    expect(i18n.t("nav.dashboard", { lng: "id" })).toBe("Dasbor");
  });
});
