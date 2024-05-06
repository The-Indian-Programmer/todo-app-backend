const { models } = require('../config/modelConfig');

class SuperDao {
    constructor(model) {
        this.model = model;
    }

    async findAll() {
        return this.model.findAll().then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async findById(id) {
        return this.model.findByPk(id).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async findOneByWhere(where, attributes = []) {
        return this.model.findOne({ where: where, attributes: attributes }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async create(data) {
        return this.model.create(data).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }


    async update(data, where) {
        return this.model.update(data, { where: where }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async delete(where) {
        return this.model.destroy({ where: where }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async findAllByWhere(where, attributes) {
        if (attributes) {
            return this.model.findAll({ where: where, attributes: attributes }).then((res) => {
                return res;
            }).catch((err) => {
                console.log(err);
            });
        }
        return this.model.findAll({ where: where }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async findAllByWhereWithOrder(where, order) {
        return this.model.findAll({ where: where, order: order }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async findAllByWhereWithOrderAndLimit(where, order, limit, attributes = []) {
        return this.model.findAll({ where: where, order: order, limit: limit, attributes }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async findAllByWhereWithOrderAndLimitAndOffset(where, order, limit, offset) {
        return this.model.findAll({ where: where, order: order, limit: limit, offset: offset }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async findCountByWhere(where) {
        return this.model.count({ where: where }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async findCount(where) {
        if (where) {
            return this.model.count({ where: where }).then((res) => {
                return res;
            }).catch((err) => {
                console.log(err);
            });
        } else {
            return this.model.count().then((res) => {
                return res;
            }).catch((err) => {
                console.log(err);
            });
        }
    }

    async findAndCountAll(where, order, limit, offset, excludeAttributes = []) {
        return this.model.findAndCountAll({
            where: where,
            order: order,
            limit: limit,
            offset: offset,
            attributes: { exclude: excludeAttributes }
        }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async bulkCreate(data) {
        return this.model.bulkCreate(data).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    // get max value
    async getMaxValue(where, column) {
        return this.model.max(column, { where: where }).then((res) => {
            console.log('res', res);
            return res;
        }).catch((err) => {
            console.log(err);
            return err;
        });
    }


    async addOrupdateWithTransaction(addData, where, transaction, updateData = null) {
        const result = await this.model.findAll({ where: where, transaction: transaction });
        if (result.length > 0) {
            let newData = updateData ? updateData : addData;
            return this.model.update(newData, { where: where, transaction: transaction }).then((res) => {
                return res;
            }).catch((err) => {
                console.log(err);
            });
        } else {
            return this.model.create(addData, { transaction: transaction }).then((res) => {
                return res;
            }).catch((err) => {
                console.log(err);
            });
        }
    }

    bulkCreateWithTransaction(data, transaction) {
        return this.model.bulkCreate(data, { transaction: transaction }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }

    async addOrUpdateRecords(addData, updateData, where) {
        const result = await this.model.findAll({ where: where });
        if (result.length > 0) {
            return this.model.update(updateData, { where: where }).then((res) => {
                return res;
            }).catch((err) => {
                console.log(err);
            });
        } else {
            return this.model.create(addData).then((res) => {
                return res;
            }).catch((err) => {
                console.log(err);
            });
        }
    }

    createWithTransaction (data, transaction) {
        return this.model.create(data, { transaction: transaction }).then((res) => {
            return res;
        }).catch((err) => {
            console.log(err);
        });
    }



}

module.exports = SuperDao;
