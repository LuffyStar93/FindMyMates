import sequelize from "../config/db";
import initModels from "./init-models";

const returned = (initModels as unknown as (s: typeof sequelize) => any)(sequelize);
const registry = returned ?? sequelize.models;
const models = {
  ...registry,
  sequelize,
} as typeof registry & { sequelize: typeof sequelize };

export default models;