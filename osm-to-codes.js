import fs from "fs";
import "dotenv/config";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const country = process.argv[2] || "FR";
process.stdout.write(`
OK, let's simplify the ${country} administrative areas structure, and create a simple OSM ID to Admin Codes mapping...
`);

let structure = fs.readFileSync(
  `./output/osm-country-admin-areas/${country}.json`,
  "utf8"
);
structure = JSON.parse(structure);

const finalMapping = {};
for (const region of structure) {
  const subregionsMapping = {};
  for (const subregion of region.children) {
    subregionsMapping[`${subregion.osm_type}:${subregion.osm_id}`] = {
      code: subregion.code,
      identifier: subregion.identifier || undefined,
    };
  }
  finalMapping[`${region.osm_type}:${region.osm_id}`] = {
    code: region.code,
    identifier: region.identifier || undefined,
    children: subregionsMapping,
  };
}

process.stdout.write(`Done.\n`);
fs.writeFileSync(
  `./output/osm-to-admin-codes/${country}.json`,
  JSON.stringify(finalMapping),
  {
    encoding: "utf8",
  }
);
