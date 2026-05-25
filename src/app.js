import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const h = React.createElement;
const feedBase = "./2b2m-update-feed/";
const rawFeedBase =
  "https://raw.githubusercontent.com/2b2m-org/2b2m-misc/main/2b2m-update-feed/";
const statsStorageKey = "twoBtwoMStatsApiBase";
const defaultStatsApiBase = "https://api.2b2m.org";
const defaultMetric = { id: "playtime", label: "Playtime" };
const defaultLimit = 10;

function App() {
  const [feed, setFeed] = useState(null);
  const [feedError, setFeedError] = useState("");
  const [apiBase, setApiBase] = useState(readInitialApiBase);
  const [apiInput, setApiInput] = useState(apiBase);
  const [metrics, setMetrics] = useState([defaultMetric]);
  const [activeMetric, setActiveMetric] = useState(defaultMetric.id);
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

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

  useEffect(() => {
    if (!apiBase) {
      setMetrics([defaultMetric]);
      return;
    }

    let cancelled = false;
    fetch(statsRoot(apiBase), { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Stats index returned ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        const nextMetrics = Array.isArray(payload.metrics) && payload.metrics.length > 0
          ? payload.metrics.map((metric) => ({
              id: metric.id,
              label: metric.label || metric.id,
            }))
          : [defaultMetric];
        setMetrics(nextMetrics);
        if (!nextMetrics.some((metric) => metric.id === activeMetric)) {
          setActiveMetric(nextMetrics[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMetrics([defaultMetric]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeMetric, apiBase]);

  useEffect(() => {
    if (!apiBase) {
      setLeaderboard(null);
      setLeaderboardError("");
      setLeaderboardLoading(false);
      return;
    }

    let cancelled = false;
    setLeaderboardLoading(true);
    setLeaderboardError("");

    fetch(metricUrl(apiBase, activeMetric, defaultLimit), { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Stats API returned ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        if (!cancelled) {
          setLeaderboard(payload);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLeaderboard(null);
          setLeaderboardError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLeaderboardLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeMetric, apiBase]);

  const latest = feed?.latestVersion ?? "loading";
  const versionCount = feed?.versions?.length ?? 0;
  const selectedMetric = useMemo(
    () => metrics.find((metric) => metric.id === activeMetric) ?? defaultMetric,
    [activeMetric, metrics]
  );

  function saveApiBase(event) {
    event.preventDefault();
    const nextBase = apiInput.trim().replace(/\/+$/, "");
    setApiBase(nextBase);
    if (nextBase) {
      window.localStorage.setItem(statsStorageKey, nextBase);
    } else {
      window.localStorage.removeItem(statsStorageKey);
    }
  }

  return h(
    "main",
    { className: "app-shell" },
    h(
      "section",
      { className: "hero", "aria-labelledby": "page-title" },
      h("div", { className: "mark", "aria-hidden": "true" }, "2B"),
      h("p", { className: "eyebrow" }, "2b2m Misc"),
      h("h1", { id: "page-title" }, "Hello world."),
      h(
        "p",
        { className: "intro-copy" },
        "A small public home for 2b2m update metadata, browser tools, and server stats."
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
      "section",
      { className: "dashboard", "aria-label": "2b2m status dashboard" },
      h(UpdateFeedPanel, {
        feed,
        feedError,
        latest,
        versionCount,
      }),
      h(LeaderboardPanel, {
        activeMetric,
        apiBase,
        apiInput,
        leaderboard,
        leaderboardError,
        leaderboardLoading,
        metrics,
        onApiInputChange: setApiInput,
        onMetricChange: setActiveMetric,
        onSubmit: saveApiBase,
        selectedMetric,
      })
    )
  );
}

function UpdateFeedPanel({ feed, feedError, latest, versionCount }) {
  const server = feed?.server;

  return h(
    "article",
    { className: "panel feed-panel" },
    h("div", { className: "panel-header" }, h("h2", null, "Update Feed")),
    h(
      "dl",
      { className: "metric-strip" },
      h("div", null, h("dt", null, "Latest version"), h("dd", null, latest)),
      h("div", null, h("dt", null, "Published entries"), h("dd", null, versionCount))
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
    server &&
      h(
        "div",
        { className: "server-state" },
        h("strong", null, server.address),
        h("span", null, server.minecraftVersion),
        h("code", null, server.motd)
      ),
    h(
      "p",
      { className: "status-note" },
      feedError
        ? `Feed unavailable: ${feedError}`
        : "Ready for public browser APIs with CORS-enabled endpoints."
    )
  );
}

function LeaderboardPanel({
  activeMetric,
  apiBase,
  apiInput,
  leaderboard,
  leaderboardError,
  leaderboardLoading,
  metrics,
  onApiInputChange,
  onMetricChange,
  onSubmit,
  selectedMetric,
}) {
  const players = Array.isArray(leaderboard?.players) ? leaderboard.players : [];

  return h(
    "article",
    { className: "panel leaderboard-panel" },
    h(
      "div",
      { className: "panel-header split" },
      h("div", null, h("h2", null, "Leaderboard"), h("p", null, `Top ${defaultLimit} by ${selectedMetric.label}`)),
      h(MetricTabs, { activeMetric, metrics, onMetricChange })
    ),
    h(
      "form",
      { className: "api-control", onSubmit },
      h("label", { htmlFor: "stats-api-base" }, "Stats API URL"),
      h("input", {
        id: "stats-api-base",
        type: "url",
        inputMode: "url",
        placeholder: "https://stats.2b2m.org",
        value: apiInput,
        onChange: (event) => onApiInputChange(event.target.value),
      }),
      h("button", { className: "button compact", type: "submit" }, "Load")
    ),
    h(
      "div",
      { className: "table-wrap" },
      h(
        "table",
        { className: "leaderboard-table" },
        h(
          "thead",
          null,
          h("tr", null, h("th", null, "#"), h("th", null, "Player"), h("th", null, selectedMetric.label))
        ),
        h(
          "tbody",
          null,
          leaderboardRows({
            apiBase,
            leaderboardError,
            leaderboardLoading,
            players,
          })
        )
      )
    )
  );
}

function MetricTabs({ activeMetric, metrics, onMetricChange }) {
  return h(
    "div",
    { className: "metric-tabs", role: "tablist", "aria-label": "Stats metric" },
    ...metrics.map((metric) =>
      h(
        "button",
        {
          key: metric.id,
          type: "button",
          className: metric.id === activeMetric ? "active" : "",
          role: "tab",
          "aria-selected": metric.id === activeMetric,
          onClick: () => onMetricChange(metric.id),
        },
        metric.label
      )
    )
  );
}

function leaderboardRows({ apiBase, leaderboardError, leaderboardLoading, players }) {
  if (!apiBase) {
    return [emptyRow("Stats API URL not set.")];
  }
  if (leaderboardLoading) {
    return [emptyRow("Loading leaderboard...")];
  }
  if (leaderboardError) {
    return [emptyRow(`Leaderboard unavailable: ${leaderboardError}`)];
  }
  if (players.length === 0) {
    return [emptyRow("No leaderboard data yet.")];
  }

  return players.map((player) =>
    h(
      "tr",
      { key: player.uuid || `${player.rank}-${player.name}` },
      h("td", { className: "rank" }, player.rank),
      h("td", null, h("span", { className: "player-name" }, player.name || player.uuid)),
      h("td", { className: "value", title: `${player.value ?? 0} ticks` }, player.displayValue ?? player.value)
    )
  );
}

function emptyRow(message) {
  return h("tr", { key: message }, h("td", { className: "empty", colSpan: 3 }, message));
}

function readInitialApiBase() {
  const url = new URL(window.location.href);
  const queryBase = url.searchParams.get("apiBase");
  if (queryBase) {
    return queryBase.trim().replace(/\/+$/, "");
  }
  return (window.localStorage.getItem(statsStorageKey) || defaultStatsApiBase)
    .trim()
    .replace(/\/+$/, "");
}

function statsRoot(apiBase) {
  const cleanBase = apiBase.trim().replace(/\/+$/, "");
  if (cleanBase.endsWith("/api/gmisc/v1/stats")) {
    return cleanBase;
  }
  return `${cleanBase}/api/gmisc/v1/stats`;
}

function metricUrl(apiBase, metricId, limit) {
  const url = new URL(`${statsRoot(apiBase)}/${metricId}`, window.location.href);
  url.searchParams.set("limit", String(limit));
  return url.toString();
}

createRoot(document.getElementById("root")).render(h(App));
