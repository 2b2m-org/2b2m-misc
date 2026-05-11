import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const h = React.createElement;
const feedBase = "./2b2m-update-feed/";
const rawFeedBase =
  "https://raw.githubusercontent.com/2b2m-org/2b2m-misc/main/2b2m-update-feed/";

function App() {
  const [feed, setFeed] = useState(null);
  const [feedError, setFeedError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(`${feedBase}meta.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Feed returned ${response.status}`);
        }
        return response.json();
      })
      .then((meta) => {
        if (!cancelled) {
          setFeed(meta);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFeedError(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const latest = feed?.latestVersion ?? "loading";
  const versionCount = feed?.versions?.length ?? 0;

  return h(
    "main",
    { className: "app-shell" },
    h(
      "section",
      { className: "workspace", "aria-labelledby": "page-title" },
      h(
        "div",
        { className: "intro" },
        h("div", { className: "mark", "aria-hidden": "true" }, "2B"),
        h(
          "div",
          null,
          h("p", { className: "eyebrow" }, "2b2m Misc"),
          h("h1", { id: "page-title" }, "Hello world.")
        ),
        h(
          "p",
          { className: "intro-copy" },
          "A small public home for 2b2m web experiments and update metadata."
        ),
        h(
          "div",
          { className: "actions" },
          h("a", { className: "button primary", href: rawFeedBase }, "Open raw feed"),
          h(
            "a",
            { className: "button", href: "./2b2m-update-feed/meta.json" },
            "View meta.json"
          )
        )
      ),
      h(
        "aside",
        { className: "status-board", "aria-label": "Update feed status" },
        h("h2", null, "Update Feed"),
        h(
          "div",
          { className: "status-grid" },
          h(
            "div",
            { className: "metric" },
            h("span", null, "Latest version"),
            h("strong", null, latest)
          ),
          h(
            "div",
            { className: "metric" },
            h("span", null, "Published entries"),
            h("strong", null, versionCount)
          )
        ),
        h(
          "ul",
          { className: "feed-list" },
          ...(feed?.versions ?? []).map((version) =>
            h(
              "li",
              { key: version.id },
              h("strong", null, version.id),
              h("span", null, version.updateType)
            )
          )
        ),
        h(
          "p",
          { className: "status-note" },
          feedError
            ? `Feed unavailable: ${feedError}`
            : "Ready for public browser APIs with CORS-enabled endpoints."
        )
      )
    )
  );
}

createRoot(document.getElementById("root")).render(h(App));
