import fs from "fs";
import {
  RequestChatGPT,
  RequestGNFirstResult,
  RequestOSMFirstResult,
  RequestWOFFirstResult,
} from "./api-clients.js";
import "dotenv/config";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const higherAdminAreasCountries = ["BE"];
const gnStateTypePerCountry = {
  FR: ["macroregion"],
};
const gnSubareaTypePerCountry = {
  FR: ["region"],
};
const wofStateTypePerCountry = {
  FR: ["macroregion"],
};
const wofSubareaTypePerCountry = {
  FR: ["region"],
};

const country = process.argv[2] || "FR";

// For Belgium for example, regions have `Address rank` == 6 instead of 8 for France or Deutschland
const hasHigherAdminAreas = higherAdminAreasCountries.indexOf(country) > -1;

process.stdout.write(`
OK, let's look for ${country} administrative areas structure !
`);

// 1. We generate the structured admin area labels of the country
let adminAreaLabels = [];
let existingLabels = null;
try {
  existingLabels = fs.readFileSync(
    `./data/admin-areas/${country}.json`,
    "utf8"
  );
} catch (e) {}
if (existingLabels) {
  adminAreaLabels = JSON.parse(existingLabels);
  process.stdout.write(
    `Fetched existing ${country} admin areas from ./admin-areas\n`
  );
} else {
  // Will throw Error if prompt not found
  const placesPrompt = fs.readFileSync(`./prompts/${country}.txt`, "utf8");
  process.stdout.write(
    `Requesting ChatGPT about ${country} admin areas (can take up to 3min)...\n`
  );
  adminAreaLabels = await RequestChatGPT(placesPrompt);
  if (adminAreaLabels && adminAreaLabels.obj) {
    adminAreaLabels = adminAreaLabels.obj;
    process.stdout.write(
      `Fetched ${country} admin areas and updated into ./admin-areas\n`
    );
    fs.writeFileSync(
      `./data/admin-areas/${country}.json`,
      JSON.stringify(adminAreaLabels),
      {
        encoding: "utf8",
      }
    );
  }
}

const areaName = (r) =>
  r.intl_name ? (r.name ? `${r.name} (${r.intl_name})` : r.intl_name) : r.name;

// 2. For each admin area (and its children), we gonna request some APIs to fetch the associated osm / wof / gn ids...
const notFoundOSMAreas = [];
const notFoundGNAreas = [];
const notFoundWOFAreas = [];
const countryAdminAreas = [];
for (const region of adminAreaLabels) {
  process.stdout.write(`_ About ${areaName(region)}... `);

  const regionData = {
    name: region.intl_name || region.name,
    code: region.code || undefined,
    identifier: region.identifier || undefined,
    osm_id: null,
    gn_id: null,
    wof_id: null,
    children: [],
  };

  // Find a OSM ID
  if (process.env.OSM_API_URL) {
    let osmRegionSearch, osmRegionSearchRegion;
    // We first look for something above `state` or `county` (?q with a place_rank === 6)
    if (hasHigherAdminAreas) {
      process.stdout.write(` (probably place_rank=6)... `);
      await sleep(200);
      osmRegionSearchRegion = await RequestOSMFirstResult(
        region.intl_name || region.name,
        country,
        "q"
      );
    }
    // Address rank == place_rank == 6
    if (osmRegionSearchRegion && osmRegionSearchRegion.place_rank === 6) {
      osmRegionSearch = osmRegionSearchRegion;
    } else {
      await sleep(200);
      osmRegionSearch = await RequestOSMFirstResult(
        region.intl_name || region.name,
        country,
        "state"
      );
    }
    if (osmRegionSearch) {
      regionData.osm_id = `osm:${osmRegionSearch.osm_type}:${osmRegionSearch.osm_id}`;
      process.stdout.write(
        `-> ${regionData.osm_id} (${osmRegionSearch.place_rank} - ${osmRegionSearch.display_name})`
      );
    } else {
      process.stdout.write(`-> [error] retry later`);
      notFoundOSMAreas.push(regionData);
    }
  }

  // Find a Geoname ID
  if (process.env.PELIAS_GEONAME_API_URL) {
    let gnRegionSearch;
    await sleep(200);
    gnRegionSearch = await RequestGNFirstResult(
      region.intl_name || region.name,
      country,
      gnStateTypePerCountry[country]
        ? gnStateTypePerCountry[country].join(",")
        : "macroregion"
    );
    if (
      !gnRegionSearch &&
      gnStateTypePerCountry[country].indexOf("region") === -1
    ) {
      // not a hyper-region ? this state might be just a "region"
      await sleep(200);
      gnRegionSearch = await RequestGNFirstResult(
        region.intl_name || region.name,
        country,
        "region"
      );
    }
    if (gnRegionSearch) {
      regionData.gn_id = gnRegionSearch.gid;
      process.stdout.write(`-> ${regionData.gn_id} (${gnRegionSearch.label})`);
    } else {
      process.stdout.write(`-> [error] retry later`);
      notFoundGNAreas.push(regionData);
    }
  }

  // Find a WOF ID
  if (process.env.PELIAS_WOF_API_URL) {
    let wofRegionSearch;
    await sleep(200);
    wofRegionSearch = await RequestWOFFirstResult(
      region.intl_name || region.name,
      country,
      wofStateTypePerCountry[country]
        ? wofStateTypePerCountry[country].join(",")
        : "macroregion"
    );
    if (
      !wofRegionSearch &&
      wofStateTypePerCountry[country].indexOf("region") === -1
    ) {
      // not a hyper-region ? this state might be just a "region"
      await sleep(200);
      wofRegionSearch = await RequestWOFFirstResult(
        region.intl_name || region.name,
        country,
        "region"
      );
    }
    if (wofRegionSearch) {
      regionData.wof_id = wofRegionSearch.gid;
      process.stdout.write(
        `-> ${regionData.wof_id} (${wofRegionSearch.label})`
      );
    } else {
      process.stdout.write(`-> [error] retry later`);
      notFoundWOFAreas.push(regionData);
    }
  }

  process.stdout.write(`\n`);

  if (region.children) {
    for (const subregion of region.children) {
      process.stdout.write(`\\_ About ${areaName(subregion)}... `);

      const subregionData = {
        name: subregion.intl_name || subregion.name,
        code: subregion.code || undefined,
        identifier: subregion.identifier || undefined,
        osm_id: null,
        wof_id: null,
        gn_id: null,
      };

      // Find a OSM ID
      if (process.env.OSM_API_URL) {
        await sleep(200);
        let osmSearch = await RequestOSMFirstResult(
          subregion.intl_name || subregion.name,
          country,
          hasHigherAdminAreas ? "state" : "county"
        );
        if (!osmSearch) {
          await sleep(200);
          osmSearch = await RequestOSMFirstResult(
            subregion.intl_name || subregion.name,
            country,
            hasHigherAdminAreas ? "county" : "state" // try the other one in case of..
          );
        }
        if (osmSearch) {
          subregionData.osm_id = `osm:${osmSearch.osm_type}:${osmSearch.osm_id}`;
          process.stdout.write(
            `-> ${subregionData.osm_id} (${osmSearch.place_rank} - ${osmSearch.display_name})`
          );
        } else {
          process.stdout.write(`-> [error] retry later`);
          notFoundOSMAreas.push(subregionData);
        }
      }

      // Find a Geoname ID
      if (process.env.PELIAS_GEONAME_API_URL) {
        let gnSerach;
        await sleep(200);
        gnSerach = await RequestGNFirstResult(
          subregion.intl_name || subregion.name,
          country,
          gnSubareaTypePerCountry[country]
            ? gnSubareaTypePerCountry[country].join(",")
            : "region"
        );
        if (gnSerach) {
          subregionData.gn_id = gnSerach.gid;
          process.stdout.write(`-> ${subregionData.gn_id} (${gnSerach.label})`);
        } else {
          process.stdout.write(`-> [error] retry later`);
          notFoundGNAreas.push(subregionData);
        }
      }

      // Find a WOF ID
      if (process.env.PELIAS_WOF_API_URL) {
        let wofSearch;
        await sleep(200);
        wofSearch = await RequestWOFFirstResult(
          subregion.intl_name || subregion.name,
          country,
          wofSubareaTypePerCountry[country]
            ? wofSubareaTypePerCountry[country].join(",")
            : "region"
        );
        if (wofSearch) {
          subregionData.wof_id = wofSearch.gid;
          process.stdout.write(
            `-> ${subregionData.wof_id} (${wofSearch.label})`
          );
        } else {
          process.stdout.write(`-> [error] retry later`);
          notFoundGNAreas.push(subregionData);
        }
      }

      process.stdout.write(`\n`);

      regionData.children.push(subregionData);
    }
  }
  countryAdminAreas.push(regionData);
}

process.stdout.write(`\n`);
process.stdout.write(
  `Finished to collect data about admin areas structure ! You can now run :\n`
);
process.stdout.write(`$ map-osm-to-admincode.js\n`);
process.stdout.write(`$ map-gn-to-admincode.js\n`);
process.stdout.write(`$ map-wof-to-admincode.js\n`);
process.stdout.write(`\n`);

fs.writeFileSync(
  `./data/enriched-admin-areas/${country}.json`,
  JSON.stringify(countryAdminAreas),
  {
    encoding: "utf8",
  }
);
