const events = require('events');
const LibraryEvents = new events.EventEmitter();
const { sequelize } = require('../config/modelConfig');
const CustomerPhaseGoalDao = require('../dao/CustomerPhaseGoalDao');
const customerPhaseGoalDao = new CustomerPhaseGoalDao();
const PhaseGoalDao = require('../dao/PhaseGoalDao');
const phaseGoalDao = new PhaseGoalDao();
const CustomerPhasesDao = require('../dao/CustomerPhasesDao');
const customerPhaseDao = new CustomerPhasesDao();
const CustomerLibraryMapDao = require('../dao/CustomerLibraryMapDao');
const { Op } = require('sequelize');
const customerLibraryMapDao = new CustomerLibraryMapDao();
const { logger } = require('../helper/logger');


LibraryEvents.on('library-purchased', async ({ customerID, phaseId }) => {
    try {
        const customerPhases = await customerPhaseDao.findAllByWhere({ customerID: customerID });

        if (!customerPhases) return;

        const phases = customerPhases.map(item => item.dataValues);
        const activePhaseId = phases.find(item => item.status === '1').id;

        const nextPhase = phases.find(item => item.id > activePhaseId);
        if (!nextPhase) return;

        const nextPhaseId = nextPhase.id;
        const nextCustomerPhaseId = nextPhase.phaseId;

        const allLibraryCount = await customerLibraryMapDao.findCountByWhere({
            status: 1, customerID: customerID, phaseId: nextCustomerPhaseId, lockStatus: {
                [Op.in]: ['1', '2']
            }
        });

        if (allLibraryCount > 0) return;

        const activeCustomerPhaseId = phases.find(item => item.status === '1').phaseId;
        const goalData = await phaseGoalDao.findOneByWhere({ phaseId: activeCustomerPhaseId, status: '1' }, ['id', 'goalType']);

        if (!goalData) {
            return logger.error(`No goal found for the phase - ${activeCustomerPhaseId} - customerID - ${customerID}`);
        }

        const goalId = goalData?.dataValues?.id;
        const goalType = goalData?.dataValues?.goalType;

        const updateActivePhaseData = { status: '2' };
        const updateActivePhaseWhere = { id: activePhaseId, customerId: customerID };

        const updateActivePhaseResponse = await customerPhaseDao.update(updateActivePhaseData, updateActivePhaseWhere);

        if (updateActivePhaseResponse[0] < 1) {
            return logger.error(`Failed to update the active phase - activePhaseId - ${activePhaseId} - customerID - ${customerID}`);
        }

        const updateNextPhaseData = { status: '1' };
        const updateNextPhaseWhere = { id: nextPhaseId, customerId: customerID };

        const updateNextPhaseResponse = await customerPhaseDao.update(updateNextPhaseData, updateNextPhaseWhere);

        if (updateNextPhaseResponse[0] < 1) {
            return logger.error(`Failed to update the next phase - nextPhaseId - ${nextPhaseId} - customerID - ${customerID}`);
        }

        if (goalId && goalType === '1') {
            const updateGoalData = { status: 'completed' };

            const updateGoalWhere = { goalId: goalId, customerId: customerID };

            const updateGoalResponse = await customerPhaseGoalDao.update(updateGoalData, updateGoalWhere);

            if (!updateGoalResponse) {
                return logger.error('Failed to update the goal - goalId - ', goalId, 'customerID - ', customerID);
            }
        }
    } catch (error) {
        logger.error(`Error in library-purchased event - ${error} - customerID - ${customerID} - phaseId - ${phaseId}`);
    }
});



module.exports = LibraryEvents;