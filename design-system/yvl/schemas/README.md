# YVL token schemas

Each canonical token document is validated against its matching Draft 2020-12 JSON Schema by `npm run validate:yvl`. Schemas require v1.0.0, reject unknown top-level properties, and constrain token value formats. The validator also regenerates artifacts in memory and fails when committed output is stale.
