var DataTypes = require("sequelize").DataTypes;
var _sequelizeMeta = require("./sequelizeMeta");
var _tasks = require("./tasks");
var _users = require("./users");

function initModels(sequelize) {
  var sequelizeMeta = _sequelizeMeta(sequelize, DataTypes);
  var tasks = _tasks(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  tasks.belongsTo(users, { as: "user", foreignKey: "userId"});
  users.hasMany(tasks, { as: "tasks", foreignKey: "userId"});
  tasks.belongsTo(users, { as: "createdByUser", foreignKey: "createdBy"});
  users.hasMany(tasks, { as: "createdByTasks", foreignKey: "createdBy"});
  tasks.belongsTo(users, { as: "updatedByUser", foreignKey: "updatedBy"});
  users.hasMany(tasks, { as: "updatedByTasks", foreignKey: "updatedBy"});

  return {
    sequelizeMeta,
    tasks,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
