import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import HomePage from "@/app/page";

test("identifies the application as the internal research prototype", () => {
  expect(renderToStaticMarkup(<HomePage />)).toContain(
    "<h1>Glyph — Internal Research Prototype</h1>",
  );
});
