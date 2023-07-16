import fs from "fs";
import { RequestChatGPT, RequestOSMFirstResult } from "./api-clients.js";
import "dotenv/config";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const higherAdminAreasCountries = ["BE"];

const country = process.argv[2] || "FR";
process.stdout.write(`
OK, let's look for ${country} administrative areas structure !
`);

// 1. We fetch admin area labels of the country
let adminAreaLabels = [];
let existingLabels = null;
try {
  existingLabels = fs.readFileSync(
    `./output-intermediate/country-admin-areas-labels/${country}.json`,
    "utf8"
  );
} catch (e) {}
if (existingLabels) {
  adminAreaLabels = JSON.parse(existingLabels);
  process.stdout.write(
    `Fetched existing ${country} admin areas from ./country-admin-areas-labels\n`
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
      `Fetched ${country} admin areas and updated into ./country-admin-areas-labels\n`
    );
    fs.writeFileSync(
      `./output-intermediate/country-admin-areas-labels/${country}.json`,
      JSON.stringify(adminAreaLabels),
      {
        encoding: "utf8",
      }
    );
  }
}

// 2. For each admin area (and its children), we gonna request OSM API to fetch the associated `osm:relation:<id>`
const retryWithTranslationsLater = [];
const countryAdminAreas = [];
for (const region of adminAreaLabels) {
  process.stdout.write(
    `_ About ${region.name}${
      region.intl_name ? " (" + region.intl_name + ")" : ""
    }... `
  );

  let osmRegionSearch, osmRegionSearchRegion;
  // For Belgium for example, regions have `Address rank` == 6.
  const hasHigherAdminAreas = higherAdminAreasCountries.indexOf(country) > -1;
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

  const regionData = {
    name: region.name,
    code: region.code,
    identifier: region.identifier || undefined,
    osm_type: null,
    osm_id: null,
    children: [],
  };
  if (osmRegionSearch) {
    regionData.osm_type = osmRegionSearch.osm_type;
    regionData.osm_id = osmRegionSearch.osm_id;
    process.stdout.write(
      `-> ${regionData.osm_type}:${regionData.osm_id} (${osmRegionSearch.place_rank} - ${osmRegionSearch.display_name})\n`
    );

    if (region.children) {
      for (const subregion of region.children) {
        process.stdout.write(
          `\\_ About ${subregion.name}${
            subregion.intl_name ? " (" + subregion.intl_name + ")" : ""
          }... `
        );

        await sleep(200);
        let osmSearch = await RequestOSMFirstResult(
          subregion.intl_name || subregion.name,
          country,
          hasHigherAdminAreas ? "state" : "county"
        );
        const subregionData = {
          has_parent: true,
          name: subregion.name,
          code: subregion.code,
          identifier: subregion.identifier || undefined,
          osm_type: null,
          osm_id: null,
        };
        if (!osmSearch) {
          await sleep(200);
          osmSearch = await RequestOSMFirstResult(
            subregion.intl_name || subregion.name,
            country,
            hasHigherAdminAreas ? "county" : "state" // try the other one in case of..
          );
        }
        if (osmSearch) {
          subregionData.osm_type = osmSearch.osm_type;
          subregionData.osm_id = osmSearch.osm_id;

          regionData.children.push(subregionData);
          process.stdout.write(
            `-> ${subregionData.osm_type}:${subregionData.osm_id} (${osmSearch.place_rank} - ${osmSearch.display_name})\n`
          );
        } else {
          process.stdout.write(`-> [error] retry later\n`);
          retryWithTranslationsLater.push(subregionData);
        }
      }
    }
    countryAdminAreas.push(regionData);
  } else {
    process.stdout.write(`-> [error] retry later\n`);
    retryWithTranslationsLater.push(regionData);
  }
}

process.stdout.write(`Done.\n`);
fs.writeFileSync(
  `./output/osm-country-admin-areas/${country}.json`,
  JSON.stringify(countryAdminAreas),
  {
    encoding: "utf8",
  }
);
