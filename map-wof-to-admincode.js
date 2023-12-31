import fs from "fs";
import "dotenv/config";

const country = process.argv[2] || "FR";
process.stdout.write(
  `OK, let's create a simple mapping WOF->admincodes for ${country}.\n`
);

let structure = fs.readFileSync(
  `./data/enriched-admin-areas/${country}.json`,
  "utf8"
);
structure = JSON.parse(structure);

const finalMapping = {};
for (const region of structure) {
  if (region.wof_id === null) {
    continue;
  }
  const subregionsMapping = {};
  for (const subregion of region.children) {
    if (subregion.wof_id === null) {
      continue;
    }
    subregionsMapping[`${subregion.wof_id}`] = {
      code: subregion.code || undefined,
      identifier: subregion.identifier || undefined,
    };
  }
  finalMapping[`${region.wof_id}`] = {
    code: region.code || undefined,
    identifier: region.identifier || undefined,
    children: subregionsMapping,
  };
}

process.stdout.write(`Done.\n`);
fs.writeFileSync(
  `./output/wof-to-admin-codes/${country}.json`,
  JSON.stringify(finalMapping),
  {
    encoding: "utf8",
  }
);
