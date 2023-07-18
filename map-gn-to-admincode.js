import fs from "fs";
import "dotenv/config";

const country = process.argv[2] || "FR";
process.stdout.write(
  `OK, let's create a simple mapping Geoname->admincodes for ${country}.\n`
);

let structure = fs.readFileSync(
  `./data/enriched-admin-areas/${country}.json`,
  "utf8"
);
structure = JSON.parse(structure);

const finalMapping = {};
for (const region of structure) {
  const subregionsMapping = {};
  for (const subregion of region.children) {
    subregionsMapping[`${subregion.gn_id}`] = {
      code: subregion.code || undefined,
      identifier: subregion.identifier || undefined,
    };
  }
  finalMapping[`${region.gn_id}`] = {
    code: region.code || undefined,
    identifier: region.identifier || undefined,
    children: subregionsMapping,
  };
}

process.stdout.write(`Done.\n`);
fs.writeFileSync(
  `./output/gn-to-admin-codes/${country}.json`,
  JSON.stringify(finalMapping),
  {
    encoding: "utf8",
  }
);
