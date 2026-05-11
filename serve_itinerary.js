const http = require("http");
const fs = require("fs");
const https = require("https");
const path = require("path");

const root = __dirname;
const port = 8123;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8"
};

const riverFlowSources = {
  south_fork_american: {
    label: "South Fork American - Chili Bar / Coloma",
    sourceLabel: "AW gauge 42558: CDEC CBR Chili Bar for Route 193 to Coloma",
    type: "cdec",
    station: "CBR",
    sensor: "20",
    notes: "Chili Bar flow reading for the Coloma / Placerville day."
  },
  klamath: {
    label: "Klamath - Keno area",
    sourceLabel: "Keno-area USGS 11510700 near the AW Keno / Big Bend access corridor",
    type: "usgs",
    site: "11510700",
    notes: "Primary live flow for the Klamath Falls boating day."
  },
  north_umpqua: {
    label: "Lower North Umpqua - Glide section",
    sourceLabel: "AW gauge 5145: USGS 14319500 at Winchester for the lower North Umpqua run below Glide",
    type: "usgs",
    site: "14319500",
    notes: "Reliable downstream gauge for the lower North Umpqua section you care about."
  },
  mckenzie: {
    label: "McKenzie - Vida-linked sections",
    sourceLabel: "AW gauge 5093: USGS 14162500 near Vida for Finn Rock / Leaburg and related sections",
    type: "usgs",
    site: "14162500",
    notes: "Flow for AW-linked McKenzie sections near Finn Rock and Leaburg."
  },
  middle_fork_willamette: {
    label: "Middle Fork Willamette - Jasper section",
    sourceLabel: "AW gauge 6308: USGS 14152000 at Jasper for Dexter Dam to Coast Fork confluence",
    type: "usgs",
    site: "14152000",
    notes: "Live flow for the Jasper / Dexter section."
  }
};

const activityResources = {
  overview: {
    title: "Trip Overview",
    intro: "info",
    sections: []
  },
  backpacking: {
    title: "Backpacking Resources",
    intro: "Trailheads, maps, permits, and official pages for the wilderness blocks in the itinerary.",
    sections: [
      {
        id: "mount-thielsen",
        title: "Mount Thielsen Wilderness",
        links: [
          {
            label: "Umpqua wilderness maps",
            href: "https://www.fs.usda.gov/r06/umpqua/maps-guides/wilderness-maps",
            note: "Official wilderness map index for the Umpqua side."
          },
          {
            label: "Mount Thielsen trail page",
            href: "https://www.fs.usda.gov/r06/umpqua/recreation/trails/mount-thielsen-trail",
            note: "Trail access and conditions for a common Thielsen approach."
          },
          {
            label: "PCT through Mount Thielsen",
            href: "https://www.fs.usda.gov/r06/umpqua/recreation/trails/pacific-crest-national-scenic-trail",
            note: "Official PCT page for the Umpqua section through Thielsen."
          }
        ]
      },
      {
        id: "diamond-peak",
        title: "Diamond Peak Wilderness",
        links: [
          {
            label: "Diamond Peak wilderness page",
            href: "https://www.fs.usda.gov/r06/willamette/recreation/diamond-peak-wilderness-willamette",
            note: "Official trailhead access, permit window, and restrictions."
          },
          {
            label: "PCT Diamond Peak page",
            href: "https://www.fs.usda.gov/r06/deschutes/recreation/trails/pacific-crest-national-scenic-trail-diamond-peak",
            note: "Good for the Summit Lake and PCT side."
          },
          {
            label: "Willamette wilderness overview",
            href: "https://www.fs.usda.gov/r06/willamette/wilderness",
            note: "Regional wilderness overview page."
          }
        ]
      },
      {
        id: "waldo-lake",
        title: "Waldo Lake Wilderness",
        links: [
          {
            label: "Waldo Lake Wilderness page",
            href: "https://www.fs.usda.gov/r06/willamette/recreation/waldo-lake-wilderness",
            note: "Official permit and trail access page."
          },
          {
            label: "Waldo Lake area page",
            href: "https://www.fs.usda.gov/r06/willamette/recreation/waldo-lake-area",
            note: "Road access, campgrounds, and lake-area logistics."
          },
          {
            label: "Islet Campground / north access",
            href: "https://www.fs.usda.gov/r06/willamette/recreation/islet-campground-waldo-lake",
            note: "Useful north-end access context."
          }
        ]
      }
    ]
  },
  kayaking: {
    title: "Kayaking Resources",
    intro: "Gauge, section, access, and local paddling links for the rivers in the itinerary.",
    sections: [
      {
        id: "south-fork-american",
        title: "South Fork American",
        links: [
          {
            label: "AW Chili Bar gauge page",
            href: "https://www.americanwhitewater.org/content/Gauge2/detail/id/219259/",
            note: "Working AW page for the Chili Bar gauge at Placerville."
          },
          {
            label: "Chili Bar live flow",
            href: "https://cdec.water.ca.gov/dynamicapp/req/CSVDataServlet?Stations=CBR&SensorNums=20&dur_code=E",
            note: "Direct CDEC flow feed for Chili Bar."
          },
          {
            label: "South Fork map and rapids overview",
            href: "https://www.americanwhitewater.com/american-river-rafting/south-fork/map",
            note: "Local commercial map with rapid names and logistics."
          },
          {
            label: "Friends of the River float notes",
            href: "https://www.friendsoftheriver.org/wp-content/uploads/2017/02/South-Fork-American-Float-Notes-regular-season.2017.pdf",
            note: "Trip notes and logistics for the South Fork."
          }
        ]
      },
      {
        id: "klamath",
        title: "Klamath - Keno / Big Bend",
        links: [
          {
            label: "AW Klamath access article",
            href: "https://www.americanwhitewater.org/content/Article/view/article_id/YJkTQPBB2e6Vcx6f66ZwE",
            note: "Current Keno, Big Bend, and downstream access notes."
          },
          {
            label: "Keno-area live gauge",
            href: "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=11510700&parameterCd=00060",
            note: "USGS flow feed below John C. Boyle near Keno."
          }
        ]
      },
      {
        id: "middle-fork-willamette",
        title: "Middle Fork Willamette",
        links: [
          {
            label: "AW Jasper gauge page",
            href: "https://www.americanwhitewater.org/content/gauge/detail-new/6308",
            note: "Working AW page for the Jasper gauge and Dexter to Coast Fork section."
          },
          {
            label: "Jasper live gauge",
            href: "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14152000&parameterCd=00060",
            note: "USGS flow feed at Jasper."
          },
          {
            label: "Middle Fork recreation page",
            href: "https://www.middleforkwillamette.org/engage/recreation/",
            note: "Local watershed page with paddling and recreation context."
          }
        ]
      },
      {
        id: "mckenzie",
        title: "McKenzie",
        links: [
          {
            label: "AW McKenzie gauge page",
            href: "https://www.americanwhitewater.org/content/Gauge2/detail/id/166182/",
            note: "Working AW page for the Paradise to Finn Rock gauge."
          },
          {
            label: "Vida live gauge",
            href: "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14162500&parameterCd=00060",
            note: "USGS flow feed for the Vida-linked sections."
          },
          {
            label: "BLM McKenzie corridor guide",
            href: "https://www.blm.gov/sites/default/files/documents/files/nwo_mcmenzieriver_brochure.pdf",
            note: "Road corridor, access, and river-adjacent facilities."
          }
        ]
      },
      {
        id: "north-umpqua",
        title: "North Umpqua - Glide",
        links: [
          {
            label: "AW Winchester gauge page",
            href: "https://www.americanwhitewater.org/content/Gauge2/detail/id/5145/",
            note: "Working AW page for the Winchester gauge and lower North Umpqua section listing."
          },
          {
            label: "Winchester live gauge",
            href: "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14319500&parameterCd=00060",
            note: "Reliable downstream gauge used on the page."
          },
          {
            label: "Rogue-Umpqua byway brochure",
            href: "https://irp.cdn-website.com/e683c15c/files/uploaded/rogue-umpqua-byway-brochure.pdf",
            note: "Useful corridor map for Glide, Idleyld Park, and Highway 138 logistics."
          }
        ]
      }
    ]
  },
  "hot-springs": {
    title: "Hot Springs Resources",
    intro: "Map layer and official pages for the hot springs stops in the itinerary.",
    sections: [
      {
        id: "regional-map",
        title: "Regional hot springs map",
        links: [
          {
            label: "USGS hot springs ArcGIS map",
            href: "https://www.arcgis.com/apps/mapviewer/index.html?layers=365b672c6afe4d76a930d727b6e58d82",
            note: "The map you provided."
          },
          {
            label: "USGS hot springs feature layer",
            href: "https://services2.arcgis.com/C8EMgrsFcRFL6LrL/ArcGIS/rest/services/hot_springs/FeatureServer/0",
            note: "Raw feature layer behind the map."
          }
        ]
      },
      {
        id: "mccredie",
        title: "McCredie / Willamette corridor",
        links: [
          {
            label: "McCredie Day Use Area",
            href: "https://www.fs.usda.gov/r06/willamette/recreation/mccredie-day-use-area",
            note: "Official page for parking, day use, and restrictions."
          },
          {
            label: "Terwilliger (Cougar) Hot Springs",
            href: "https://www.fs.usda.gov/r06/willamette/recreation/terwilliger-cougar-hot-springs",
            note: "Backup soak option in the McKenzie corridor."
          }
        ]
      },
      {
        id: "umpqua",
        title: "Umpqua corridor",
        links: [
          {
            label: "Umpqua Hot Springs Trailhead",
            href: "https://www.fs.usda.gov/r06/umpqua/recreation/umpqua-hot-springs-trailhead",
            note: "Access page and current restrictions."
          }
        ]
      }
    ]
  }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseItinerary(text) {
  const lines = text.split(/\r?\n/);
  const title = lines[0] || "Summer Road Trip Itinerary";
  const route = lines[1] || "";
  const dates = (lines[2] || "").replace(/^Dates:\s*/, "");
  const assumptions = [];
  const permitNotes = [];
  const tripShape = [];
  const days = [];
  const rivers = [];
  const hotSprings = [];
  const freeCampZones = [];
  const sourceNotes = [];

  let section = "";
  let currentDay = null;

  for (const line of lines.slice(3)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed === "Planning assumptions") {
      section = "assumptions";
      continue;
    }
    if (trimmed === "Trip shape") {
      section = "tripShape";
      continue;
    }
    if (trimmed === "Permit notes") {
      section = "permitNotes";
      continue;
    }
    if (trimmed === "Day-by-day") {
      section = "days";
      continue;
    }
    if (trimmed === "Rivers to target") {
      section = "rivers";
      continue;
    }
    if (trimmed === "Hot springs to fold in") {
      section = "hotSprings";
      continue;
    }
    if (trimmed === "Free-camp zones to lean on") {
      section = "freeCampZones";
      continue;
    }
    if (trimmed === "Source notes") {
      section = "sourceNotes";
      continue;
    }

    if (section === "days" && /^[A-Z][a-z]{2} \d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      currentDay = { date: trimmed, title: "", drive: "", plan: "", night: "" };
      days.push(currentDay);
      continue;
    }

    if (!trimmed.startsWith("- ")) {
      continue;
    }

    const item = trimmed.slice(2);

    if (section === "assumptions") {
      assumptions.push(item);
    } else if (section === "permitNotes") {
      permitNotes.push(item);
    } else if (section === "tripShape") {
      tripShape.push(item);
    } else if (section === "rivers") {
      rivers.push(item);
    } else if (section === "hotSprings") {
      hotSprings.push(item);
    } else if (section === "freeCampZones") {
      freeCampZones.push(item);
    } else if (section === "sourceNotes") {
      sourceNotes.push(item);
    } else if (section === "days" && currentDay) {
      if (item.startsWith("Drive: ")) {
        currentDay.drive = item.slice(7);
      } else if (item.startsWith("Plan: ")) {
        currentDay.plan = item.slice(6);
      } else if (item.startsWith("Night: ")) {
        currentDay.night = item.slice(7);
      } else if (!currentDay.title) {
        currentDay.title = item;
      }
    }
  }

  return {
    title,
    route,
    dates,
    assumptions,
    permitNotes,
    tripShape,
    days,
    rivers,
    hotSprings,
    freeCampZones,
    sourceNotes
  };
}

function parseStops(csvText) {
  const [headerLine, ...rows] = csvText.trim().split(/\r?\n/);
  const headers = headerLine.split(",");

  return rows
    .filter(Boolean)
    .map((row) => {
      const values = row.split(",");
      const stop = {};
      headers.forEach((header, index) => {
        stop[header] = values[index] || "";
      });
      stop.lat = Number(stop.lat);
      stop.lng = Number(stop.lng);
      return stop;
    });
}

function dateKeyFromDay(day) {
  const match = day.date.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function createGoogleMapsDirectionsLink(waypoints) {
  const cleaned = waypoints.filter(Boolean);
  if (cleaned.length < 2) {
    return "";
  }

  return `https://www.google.com/maps/dir/${cleaned.map((waypoint) => encodeURIComponent(waypoint)).join("/")}`;
}

function formatStopWaypoint(stop) {
  if (!stop) {
    return "";
  }

  if (Number.isFinite(stop.lat) && Number.isFinite(stop.lng)) {
    return `${stop.lat},${stop.lng}`;
  }

  return stop.place || stop.title || "";
}

function buildDailyMapLinks(days, stops) {
  const sortedStops = [...stops].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return 0;
  });

  const linkMap = new Map();

  days.forEach((day) => {
    const dayKey = dateKeyFromDay(day);
    const dayStops = sortedStops.filter((stop) => stop.date === dayKey);
    if (!dayStops.length) {
      return;
    }

    const firstStopIndex = sortedStops.findIndex((stop) => stop === dayStops[0]);
    const previousStop = firstStopIndex > 0 ? sortedStops[firstStopIndex - 1] : null;
    const places = [
      previousStop ? formatStopWaypoint(previousStop) : "",
      ...dayStops.map((stop) => formatStopWaypoint(stop))
    ].filter(Boolean);
    const dedupedPlaces = places.filter((place, index) => index === 0 || place !== places[index - 1]);
    const href = createGoogleMapsDirectionsLink(dedupedPlaces);

    if (!href) {
      return;
    }

    linkMap.set(dayKey, {
      href,
      label: dedupedPlaces.join(" -> ")
    });
  });

  return linkMap;
}

function parseStats(assumptions) {
  const totalDrivingLine = assumptions.find((item) => item.startsWith("Total projected driving:"));
  const gasLine = assumptions.find((item) => item.startsWith("Gas projection:"));

  return {
    totalDriving: totalDrivingLine ? totalDrivingLine.replace("Total projected driving: ", "") : "",
    gasProjection: gasLine ? gasLine.replace("Gas projection: ", "") : ""
  };
}

function parseMileage(driveText) {
  const match = driveText.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function classifyDay(day) {
  const title = day.title.toLowerCase();
  const plan = day.plan.toLowerCase();
  const combined = `${title} ${plan}`;
  const miles = parseMileage(day.drive);

  if (
    combined.includes("backpack") ||
    combined.includes("trail day") ||
    combined.includes("hike out") ||
    combined.includes("river day") ||
    combined.includes("boating day") ||
    combined.includes("paddle") ||
    combined.includes("hot springs") ||
    combined.includes("soak")
  ) {
    return "activity";
  }

  if (
    !title.includes(" to ") &&
    (combined.includes("san francisco") ||
      combined.includes("bend day") ||
      combined.includes("eugene") ||
      combined.includes("city day") ||
      combined.includes("town day") ||
      combined.includes("friends")) &&
    miles <= 35
  ) {
    return "city";
  }

  if (title.includes(" to ") || miles >= 60) {
    return "drive";
  }

  return "activity";
}

function detectRiverKey(day) {
  const combined = `${day.title} ${day.plan}`.toLowerCase();
  const hasRiverIntent =
    combined.includes("flow") ||
    combined.includes("river day") ||
    combined.includes("boating day") ||
    combined.includes("paddle") ||
    combined.includes("run ") ||
    combined.includes(" run") ||
    combined.includes("scout") ||
    combined.includes("lap");

  if (combined.includes("south fork american") || combined.includes("chili bar") || combined.includes("coloma")) {
    return "south_fork_american";
  }
  if (combined.includes("klamath") && hasRiverIntent) {
    return "klamath";
  }
  if ((combined.includes("north umpqua") || combined.includes("idleyld") || combined.includes("glide")) && hasRiverIntent) {
    return "north_umpqua";
  }
  if (combined.includes("mckenzie") && hasRiverIntent) {
    return "mckenzie";
  }
  if ((combined.includes("middle fork willamette") || combined.includes("jasper") || combined.includes("dexter")) && hasRiverIntent) {
    return "middle_fork_willamette";
  }

  return "";
}

function detectActivityLinks(day) {
  const combined = `${day.title} ${day.plan}`.toLowerCase();
  const links = [];
  const riverKey = detectRiverKey(day);

  if (combined.includes("backpack") || combined.includes("wilderness") || combined.includes("trailhead")) {
    if (combined.includes("thielsen") || combined.includes("kelsay") || combined.includes("north umpqua headwaters")) {
      links.push({ href: "/activities/backpacking#mount-thielsen", label: "Backpacking resources" });
    } else if (combined.includes("diamond peak") || combined.includes("summit lake")) {
      links.push({ href: "/activities/backpacking#diamond-peak", label: "Backpacking resources" });
    } else if (combined.includes("waldo")) {
      links.push({ href: "/activities/backpacking#waldo-lake", label: "Backpacking resources" });
    } else {
      links.push({ href: "/activities/backpacking", label: "Backpacking resources" });
    }
  }

  if (combined.includes("hot spring") || combined.includes("mccredie") || combined.includes("terwilliger")) {
    if (combined.includes("mccredie") || combined.includes("terwilliger")) {
      links.push({ href: "/activities/hot-springs#mccredie", label: "Hot springs resources" });
    } else {
      links.push({ href: "/activities/hot-springs", label: "Hot springs resources" });
    }
  }

  if (riverKey) {
    const riverAnchors = {
      south_fork_american: "/activities/kayaking#south-fork-american",
      klamath: "/activities/kayaking#klamath",
      middle_fork_willamette: "/activities/kayaking#middle-fork-willamette",
      mckenzie: "/activities/kayaking#mckenzie",
      north_umpqua: "/activities/kayaking#north-umpqua"
    };
    links.push({ href: riverAnchors[riverKey] || "/activities/kayaking", label: "Kayaking resources" });
  }

  return links;
}

function renderTopNav(activePage) {
  const items = [
    { href: "/", label: "Itinerary", key: "home" },
    { href: "/activities/overview", label: "Overview", key: "overview" },
    { href: "/activities/backpacking", label: "Backpacking", key: "backpacking" },
    { href: "/activities/kayaking", label: "Kayaking", key: "kayaking" },
    { href: "/activities/hot-springs", label: "Hot Springs", key: "hot-springs" }
  ];

  return `
    <nav class="topnav" aria-label="Primary">
      ${items
        .map(
          (item) =>
            `<a class="topnav-link${item.key === activePage ? " is-active" : ""}" href="${item.href}">${escapeHtml(item.label)}</a>`
        )
        .join("")}
    </nav>
  `;
}

function renderList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderPage(data, stops) {
  const dailyMapLinks = buildDailyMapLinks(data.days, stops);
  const daysHtml = data.days
    .map((day) => {
      const dayKey = dateKeyFromDay(day);
      const dayType = classifyDay(day);
      const riverKey = detectRiverKey(day);
      const mapLink = dailyMapLinks.get(dayKey);
      const flowHtml = riverKey
        ? `
        <div class="flow-box" data-flow-key="${escapeHtml(riverKey)}">
          <p class="flow-label">${escapeHtml(riverFlowSources[riverKey].label)} flow</p>
          <p class="flow-value">Loading live cfs...</p>
          <p class="flow-meta">${escapeHtml(riverFlowSources[riverKey].sourceLabel)}</p>
        </div>
      `
        : "";
      const activityLinks = detectActivityLinks(day);
      const linksHtml = activityLinks.length
        ? `
        <div class="resource-links">
          ${activityLinks.map((link) => `<a href="${link.href}">${escapeHtml(link.label)}</a>`).join("")}
        </div>
      `
        : "";
      const driveLinkHtml = mapLink
        ? `
        <div class="drive-link">
          <a href="${mapLink.href}" target="_blank" rel="noreferrer">Open route in Google Maps</a>
        </div>
      `
        : "";

      return `
      <article class="day day-${dayType}" data-day-date="${escapeHtml(day.date.slice(4))}">
        <header>
          <div>
            <h3>${escapeHtml(day.date)}</h3>
            <p class="day-type">${escapeHtml(dayType)} day</p>
          </div>
          <div class="miles">${escapeHtml(day.drive)}</div>
        </header>
        <p class="tagline">${escapeHtml(day.title)}</p>
        <p class="meta">${escapeHtml(day.plan)}</p>
        ${driveLinkHtml}
        ${flowHtml}
        ${linksHtml}
        <p class="night"><strong>Night:</strong> ${escapeHtml(day.night)}</p>
      </article>
    `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  >
  <style>
    :root {
      --bg: #f4efe6;
      --panel: rgba(255, 250, 242, 0.92);
      --ink: #1f2a1f;
      --muted: #5b6858;
      --accent: #2d6a4f;
      --accent-2: #bc6c25;
      --line: rgba(31, 42, 31, 0.12);
      --shadow: 0 18px 45px rgba(35, 30, 20, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(188, 108, 37, 0.12), transparent 28%),
        radial-gradient(circle at top right, rgba(45, 106, 79, 0.12), transparent 32%),
        linear-gradient(180deg, #f7f1e7 0%, #f0e7d8 100%);
    }

    a {
      color: var(--accent);
    }

    .page {
      display: grid;
      grid-template-columns: minmax(340px, 1.05fr) minmax(380px, 0.95fr);
      height: 100vh;
      gap: 20px;
      padding: 20px;
    }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 22px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .map-wrap {
      display: grid;
      grid-template-rows: auto 1fr;
      position: sticky;
      top: 20px;
      height: calc(100vh - 40px);
    }

    .hero {
      padding: 24px 24px 10px;
      border-bottom: 1px solid var(--line);
    }

    .topnav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 14px;
    }

    .topnav-link {
      display: inline-block;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.78);
      color: var(--ink);
      text-decoration: none;
      font-size: 0.88rem;
    }

    .topnav-link.is-active {
      background: rgba(45, 106, 79, 0.14);
      border-color: rgba(45, 106, 79, 0.28);
      color: #24513c;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: var(--accent-2);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 0.75rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 3vw, 3rem);
      line-height: 1;
    }

    .subhead {
      margin: 10px 0 0;
      color: var(--muted);
      max-width: 64ch;
    }

    #map {
      width: 100%;
      min-height: 0;
      height: 100%;
      background: linear-gradient(180deg, #e7efe5 0%, #dde7dd 100%);
    }

    .sidebar h2 {
      margin: 0 0 10px;
      font-size: 1rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .sidebar {
      display: block;
      height: calc(100vh - 40px);
      overflow-y: auto;
      overflow-x: hidden;
    }

    .notes,
    .summary {
      padding: 24px;
      border-bottom: 1px solid var(--line);
    }

    .notes p,
    .summary p {
      margin: 0;
      color: var(--muted);
    }

    .day-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }

    .legend-chip,
    .day-type {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .legend-city,
    .day-city .day-type {
      background: rgba(45, 106, 79, 0.14);
      color: #24513c;
    }

    .legend-drive,
    .day-drive .day-type {
      background: rgba(188, 108, 37, 0.16);
      color: #8c4f18;
    }

    .legend-activity,
    .day-activity .day-type {
      background: rgba(58, 124, 165, 0.14);
      color: #275b79;
    }

    .days {
      padding: 18px;
    }

    .days-note {
      margin: 0 0 14px;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .day {
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.62);
    }

    .day + .day {
      margin-top: 12px;
    }

    .day-city {
      border-color: rgba(45, 106, 79, 0.24);
      background: rgba(241, 248, 243, 0.9);
    }

    .day-drive {
      border-color: rgba(188, 108, 37, 0.24);
      background: rgba(250, 244, 237, 0.92);
    }

    .day-activity {
      border-color: rgba(58, 124, 165, 0.24);
      background: rgba(239, 246, 250, 0.92);
    }

    .day header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .day h3 {
      margin: 0;
      font-size: 1.05rem;
    }

    .day .miles {
      color: var(--accent-2);
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .meta {
      margin: 0 0 8px;
      color: var(--muted);
      font-size: 0.92rem;
    }

    .flow-box {
      margin: 0 0 10px;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.72);
    }

    .flow-label,
    .flow-value,
    .flow-meta {
      margin: 0;
    }

    .flow-label {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
    }

    .flow-value {
      margin-top: 6px;
      font-size: 1rem;
      font-weight: 700;
      color: var(--ink);
    }

    .flow-meta {
      margin-top: 6px;
      font-size: 0.82rem;
      color: var(--muted);
    }

    .resource-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 10px;
    }

    .resource-links a {
      display: inline-block;
      padding: 7px 10px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.84);
      text-decoration: none;
      font-size: 0.84rem;
    }

    .drive-link {
      margin: 0 0 10px;
    }

    .drive-link a {
      display: inline-block;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(45, 106, 79, 0.1);
      text-decoration: none;
      font-size: 0.84rem;
      color: #24513c;
    }

    .tagline {
      margin: 0 0 8px;
      font-weight: 700;
    }

    .night {
      margin: 0;
      color: var(--accent);
    }

    @media (max-width: 1080px) {
      .page {
        grid-template-columns: 1fr;
        height: auto;
        min-height: 100vh;
        overflow: auto;
      }

      body {
        overflow: auto;
      }

      .map-wrap,
      .sidebar {
        position: static;
        height: auto;
      }

      #map {
        min-height: 360px;
        height: 360px;
      }
    }

    @media (max-width: 640px) {
      .stats {
        grid-template-columns: 1fr;
      }

      .page {
        padding: 12px;
        gap: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="panel map-wrap">
      <div class="hero">
        ${renderTopNav("home")}
        <p class="eyebrow">Summer 2026 Road Trip</p>
        <h1>${escapeHtml(data.route)}</h1>
        <p class="subhead">${escapeHtml(data.assumptions[7] || "")}</p>
      </div>
      <div id="map" aria-label="Trip map"></div>
    </section>

    <aside class="panel sidebar">
      <div class="notes">
        ${renderTopNav("home")}
        <h2>Notes</h2>
        <p>${escapeHtml(data.assumptions[0] || "")}</p>
        <div class="day-legend">
          <span class="legend-chip legend-city">City day</span>
          <span class="legend-chip legend-drive">Drive day</span>
          <span class="legend-chip legend-activity">Activity day</span>
        </div>
      </div>
      <div class="days">
        <p class="days-note">Showing itinerary days from yesterday onward.</p>
        ${daysHtml}
      </div>
    </aside>
  </div>

  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script>
    const stops = ${JSON.stringify(stops)};
    const flowSources = ${JSON.stringify(riverFlowSources)};
    const markerColors = {
      start: "#bc6c25",
      finish: "#bc6c25",
      friend_stay: "#2d6a4f",
      van_camp: "#4b6b57",
      river_day: "#3a7ca5",
      hot_springs: "#c66b3d",
      backpacking: "#7f5539"
    };

    const map = L.map("map", { scrollWheelZoom: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
      crossOrigin: true
    }).addTo(map);

    const latLngs = stops.map((stop) => [stop.lat, stop.lng]);
    const route = L.polyline(latLngs, {
      color: "#2d6a4f",
      weight: 4,
      opacity: 0.9
    }).addTo(map);

    stops.forEach((stop, index) => {
      const marker = L.circleMarker([stop.lat, stop.lng], {
        radius: 7,
        color: markerColors[stop.type] || "#bc6c25",
        weight: 2,
        fillColor: "#fff8ef",
        fillOpacity: 1
      }).addTo(map);

      marker.bindPopup(
        "<strong>" + (index + 1) + ". " + stop.title + "</strong><br>" +
        stop.place + "<br>" +
        stop.date
      );

    });

    map.fitBounds(route.getBounds(), { padding: [40, 40] });

    function formatTimestamp(isoText) {
      const cdecMatch = isoText.match(/^(\\d{4})(\\d{2})(\\d{2})\\s+(\\d{2})(\\d{2})$/);
      if (cdecMatch) {
        const [, year, month, day, hour, minute] = cdecMatch;
        return new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }).format(new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)));
      }

      const date = new Date(isoText);
      if (Number.isNaN(date.getTime())) {
        return isoText;
      }

      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(date);
    }

    fetch("/api/flows")
      .then((response) => response.json())
      .then((flowData) => {
        document.querySelectorAll("[data-flow-key]").forEach((element) => {
          const key = element.getAttribute("data-flow-key");
          const data = flowData[key];
          const valueEl = element.querySelector(".flow-value");
          const metaEl = element.querySelector(".flow-meta");
          const source = flowSources[key];

          if (!data || data.error) {
            valueEl.textContent = "Live flow unavailable";
            metaEl.textContent = source.sourceLabel + " - " + (data && data.error ? data.error : "fetch failed");
            return;
          }

          valueEl.textContent = data.valueText + " cfs";
          metaEl.textContent = source.sourceLabel + " - updated " + formatTimestamp(data.observedAt);
        });
      })
      .catch(() => {
        document.querySelectorAll("[data-flow-key]").forEach((element) => {
          const key = element.getAttribute("data-flow-key");
          const valueEl = element.querySelector(".flow-value");
          const metaEl = element.querySelector(".flow-meta");
          const source = flowSources[key];
          valueEl.textContent = "Live flow unavailable";
          metaEl.textContent = source.sourceLabel + " - request failed";
        });
      });

    const today = new Date();
    const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    document.querySelectorAll("[data-day-date]").forEach((element) => {
      const dateText = element.getAttribute("data-day-date");
      const match = dateText.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (!match) {
        return;
      }

      const [, year, month, day] = match;
      const dayDate = new Date(Number(year), Number(month) - 1, Number(day));
      if (dayDate < cutoff) {
        element.style.display = "none";
      }
    });

  </script>
</body>
</html>`;
}

let lastRenderedItinerary = {
  permitNotes: [],
  tripShape: [],
  rivers: [],
  hotSprings: [],
  freeCampZones: []
};

function renderActivityPage(slug) {
  const page = activityResources[slug];
  if (!page) {
    return "";
  }

  const sections =
    slug === "overview"
      ? [
          { id: "permits", title: "Permit Notes", items: lastRenderedItinerary.permitNotes },
          { id: "trip-shape", title: "Trip Shape", items: lastRenderedItinerary.tripShape },
          { id: "river-targets", title: "River Targets", items: lastRenderedItinerary.rivers },
          { id: "hot-springs", title: "Hot Springs", items: lastRenderedItinerary.hotSprings },
          { id: "camp-zones", title: "Free-Camp Zones", items: lastRenderedItinerary.freeCampZones }
        ]
      : page.sections;

  const sectionsHtml = sections
    .map((section) => {
      if (section.items) {
        return `
        <section class="resource-section" id="${section.id}">
          <h2>${escapeHtml(section.title)}</h2>
          <article class="resource-card">
            <ul class="overview-list">${renderList(section.items)}</ul>
          </article>
        </section>
      `;
      }

      return `
        <section class="resource-section" id="${section.id}">
          <h2>${escapeHtml(section.title)}</h2>
          <div class="resource-grid">
            ${section.links
              .map(
                (link) => `
                  <article class="resource-card">
                    <h3><a href="${link.href}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a></h3>
                    <p>${escapeHtml(link.note)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.title)}</title>
  <style>
    :root {
      --bg: #f4efe6;
      --panel: rgba(255, 250, 242, 0.94);
      --ink: #1f2a1f;
      --muted: #5b6858;
      --accent: #2d6a4f;
      --line: rgba(31, 42, 31, 0.12);
      --shadow: 0 18px 45px rgba(35, 30, 20, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(188, 108, 37, 0.12), transparent 28%),
        radial-gradient(circle at top right, rgba(45, 106, 79, 0.12), transparent 32%),
        linear-gradient(180deg, #f7f1e7 0%, #f0e7d8 100%);
    }

    a {
      color: var(--accent);
    }

    .page {
      max-width: 1120px;
      margin: 0 auto;
      padding: 20px;
    }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 22px;
      box-shadow: var(--shadow);
      padding: 24px;
    }

    .topnav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 18px;
    }

    .topnav-link {
      display: inline-block;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.78);
      color: var(--ink);
      text-decoration: none;
      font-size: 0.88rem;
    }

    .topnav-link.is-active {
      background: rgba(45, 106, 79, 0.14);
      border-color: rgba(45, 106, 79, 0.28);
      color: #24513c;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 1;
    }

    .intro {
      margin: 12px 0 0;
      color: var(--muted);
      max-width: 60ch;
    }

    .resource-section + .resource-section {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid var(--line);
    }

    .resource-section h2 {
      margin: 0 0 14px;
      font-size: 1.2rem;
    }

    .resource-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .resource-card {
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.7);
    }

    .resource-card h3 {
      margin: 0 0 8px;
      font-size: 1rem;
    }

    .resource-card p {
      margin: 0;
      color: var(--muted);
    }

    .overview-list {
      margin: 0;
      padding-left: 18px;
      color: var(--muted);
    }

    @media (max-width: 760px) {
      .resource-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="panel">
      ${renderTopNav(slug)}
      <h1>${escapeHtml(page.title)}</h1>
      <p class="intro">${escapeHtml(page.intro)}</p>
      ${sectionsHtml}
    </section>
  </div>
</body>
</html>`;
}

function readTextFile(filename) {
  return fs.promises.readFile(path.join(root, filename), "utf8");
}

async function serveGeneratedPage(res) {
  try {
    const [itineraryText, stopsCsv] = await Promise.all([
      readTextFile("itinerary.txt"),
      readTextFile("trip_stops.csv")
    ]);

    const itinerary = parseItinerary(itineraryText);
    const stops = parseStops(stopsCsv);
    lastRenderedItinerary = itinerary;

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderPage(itinerary, stops));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Failed to build itinerary page");
  }
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "summer-trip-itinerary/1.0"
          }
        },
        (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`));
            response.resume();
            return;
          }

          let data = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            data += chunk;
          });
          response.on("end", () => resolve(data));
        }
      )
      .on("error", reject);
  });
}

async function fetchUsgsFlow(site) {
  const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${site}&parameterCd=00060`;
  const text = await fetchText(url);
  const payload = JSON.parse(text);
  const series = payload.value.timeSeries[0];
  const latest = series.values[0].value.at(-1);

  return {
    valueText: latest.value,
    observedAt: latest.dateTime
  };
}

async function fetchCdecFlow(station, sensor) {
  const url = `https://cdec.water.ca.gov/dynamicapp/req/CSVDataServlet?Stations=${station}&SensorNums=${sensor}&dur_code=E`;
  const text = await fetchText(url);
  const lines = text.trim().split(/\r?\n/);
  const lastLine = [...lines]
    .reverse()
    .find((line) => {
      const columns = line.split(",");
      return columns.length > 6 && /^\d+(\.\d+)?$/.test((columns[6] || "").trim());
    });

  if (!lastLine) {
    throw new Error("No numeric CDEC flow row found");
  }

  const columns = lastLine.split(",");

  return {
    valueText: columns[6].trim(),
    observedAt: columns[4].trim()
  };
}

async function fetchRiverFlows() {
  const entries = await Promise.all(
    Object.entries(riverFlowSources).map(async ([key, source]) => {
      try {
        const data =
          source.type === "usgs"
            ? await fetchUsgsFlow(source.site)
            : await fetchCdecFlow(source.station, source.sensor);

        return [key, data];
      } catch (error) {
        return [key, { error: error.message }];
      }
    })
  );

  return Object.fromEntries(entries);
}

function handleRequest(req, res) {
  const reqUrl = new URL(req.url, "http://localhost");
  const reqPath = decodeURIComponent(reqUrl.pathname);

  if (reqPath === "/" || reqPath === "/index.html") {
    serveGeneratedPage(res);
    return;
  }

  if (reqPath.startsWith("/activities/")) {
    const slug = reqPath.replace("/activities/", "").replace(/\/$/, "");
    readTextFile("itinerary.txt")
      .then((itineraryText) => {
        lastRenderedItinerary = parseItinerary(itineraryText);
        const page = renderActivityPage(slug);
        if (!page) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(page);
      })
      .catch(() => {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Failed to build activity page");
      });
    return;
  }

  if (reqPath === "/api/flows") {
    fetchRiverFlows()
      .then((flows) => {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(flows));
      })
      .catch(() => {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "Failed to load live flows" }));
      });
    return;
  }

  const filePath = path.normalize(path.join(root, reqPath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

if (require.main === module) {
  http.createServer(handleRequest).listen(port, () => {
    console.log(`Serving trip files at http://localhost:${port}/`);
  });
}

module.exports = {
  handleRequest
};
