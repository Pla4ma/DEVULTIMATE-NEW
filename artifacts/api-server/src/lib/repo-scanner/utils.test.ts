import { describe, it, expect } from "vitest";
import { isSafePath, getExtension, isBinary, redactSecrets } from "./utils";

describe("isSafePath (zip-slip / path-traversal defense)", () => {
  it("accepts a normal relative path", () => {
    expect(isSafePath("src/index.ts")).toBe(true);
    expect(isSafePath("package.json")).toBe(true);
  });

  it("rejects parent-directory traversal", () => {
    expect(isSafePath("../etc/passwd")).toBe(false);
    expect(isSafePath("src/../../secrets")).toBe(false);
    expect(isSafePath("a/b/../../../../../../etc/shadow")).toBe(false);
  });

  it("rejects absolute paths", () => {
    expect(isSafePath("/etc/passwd")).toBe(false);
  });

  it("rejects null-byte injection", () => {
    expect(isSafePath("src/index.ts\0.png")).toBe(false);
  });

  it("rejects excessively deep paths", () => {
    const deep = Array.from({ length: 50 }, (_, i) => `d${i}`).join("/") + "/file.ts";
    expect(isSafePath(deep)).toBe(false);
  });
});

describe("getExtension", () => {
  it("returns lowercased extension", () => {
    expect(getExtension("App.TSX")).toBe(".tsx");
    expect(getExtension("config.JSON")).toBe(".json");
  });
  it("returns empty string when no extension", () => {
    expect(getExtension("Dockerfile")).toBe("");
  });
});

describe("isBinary", () => {
  it("flags common media/binary extensions", () => {
    expect(isBinary("logo.png")).toBe(true);
    expect(isBinary("photo.jpg")).toBe(true);
  });
  it("does not flag source files", () => {
    expect(isBinary("index.ts")).toBe(false);
    expect(isBinary("styles.css")).toBe(false);
  });
});

describe("redactSecrets", () => {
  it("returns a string and never throws on arbitrary input", () => {
    expect(typeof redactSecrets("const x = 1;")).toBe("string");
    expect(redactSecrets("")).toBe("");
  });
  it("does not leak an obvious AWS-style access key in output", () => {
    const line = 'const key = "AKIAIOSFODNN7EXAMPLE";';
    const out = redactSecrets(line);
    expect(out.includes("AKIAIOSFODNN7EXAMPLE")).toBe(false);
  });
});
