const events = require('events');
const CONFIG = require('../config/config');
const axios = require('axios');
const momentTimezone = require('moment-timezone');
const moment = require("moment")
const CommonFunction = require('../models/function.model');
const Subscription = require('../models/subscription.model');
const CrispEvents = new events.EventEmitter();

axios.defaults.headers.common['Authorization'] = `Basic Y2JiODBjMzItOWUxMi00M2U0LThmNTYtM2Q3NDZiMjcwZmNkOjI5ZjAwOTljMzEwMzViMTY4NDFkMmE1ODdlY2RjNDc1YzBiNzQzNzljZmE1MTM0ZTQwMTkyZDM0NTdhZWY5ZjM`;

const headerOptions = {
    'Content-Type': 'application/json',
    'X-Crisp-Tier': 'plugin',
    'Authorization': `Basic Y2JiODBjMzItOWUxMi00M2U0LThmNTYtM2Q3NDZiMjcwZmNkOjI5ZjAwOTljMzEwMzViMTY4NDFkMmE1ODdlY2RjNDc1YzBiNzQzNzljZmE1MTM0ZTQwMTkyZDM0NTdhZWY5ZjM`
}

CrispEvents.on('user-logged-in', async (data) => {
    let { profile } = data


    if (profile.byCheckout) {
        // get country information
        let infoCountry = { table: 'country', column: ['country_code as countryCode', 'country_name as countryName'], where: { countryID: profile.countryID } }
        let countryInfo = await CommonFunction.getAllRecordsOnly(infoCountry)


        if (!helper.isEmpty(countryInfo.err)) {
            profile["countryCode"] = ''
            profile["countryName"] = ''
        } else {
            profile["countryCode"] = countryInfo.data ? countryInfo.data[0].countryCode : ''
            profile["countryName"] = countryInfo.data ? countryInfo.data[0].countryName : ''
        }



        let cusotmerSubscriptionInfo = await Subscription.getCustomerActiveSubscriptionDetails({ customerID: profile.customerID })


        if (!helper.isEmpty(cusotmerSubscriptionInfo.err)) {
            profile["subscriptionDetails"]["planName"] = ''
            profile["subscriptionDetails"]["planCharges"] = ''
            profile["subscriptionDetails"]["planUUID"] = ''
            profile["subscriptionDetails"]["currencySymobl"] = ''
            profile["subscriptionDetails"]["currencyCode"] = ''
            profile["subscriptionDetails"]["couponCode"] = ''
            profile["subscriptionDetails"]["createdOn"] = ''
        } else {
            profile["subscriptionDetails"]["planName"] = cusotmerSubscriptionInfo.data.planName
            profile["subscriptionDetails"]["planCharges"] = cusotmerSubscriptionInfo.data.planCharges
            profile["subscriptionDetails"]["planUUID"] = cusotmerSubscriptionInfo.data.planUUID
            profile["subscriptionDetails"]["currencySymobl"] = cusotmerSubscriptionInfo.data.currencySymobl
            profile["subscriptionDetails"]["currencyCode"] = cusotmerSubscriptionInfo.data.currencyCode
            profile["subscriptionDetails"]["couponCode"] = cusotmerSubscriptionInfo.data.couponCode
            profile["subscriptionDetails"]["createdOn"] = cusotmerSubscriptionInfo.data.createdOn
        }



    }




    try {
        if (helper.isEmpty(profile.crispPeopleId)) {
            let addProfileUrl = `${CONFIG.CRISP_BASE_URL}people/profile`;
            let customerName = `${(!helper.isEmpty(profile.firstName) ? profile.firstName : '')} ${(!helper.isEmpty(profile.lastName) ? profile.lastName : '')}`;



            let data = {
                "email": profile.email,
                "name": customerName,
                "segments": [],
                "avatar": !helper.isEmpty(profile.photourl) ? profile.photourl : 'https://png.pngtree.com/element_our/png/20181206/users-vector-icon-png_260862.jpg',
                "person": {
                    "nickname": customerName,
                    "avatar": !helper.isEmpty(profile.photourl) ? profile.photourl : 'https://png.pngtree.com/element_our/png/20181206/users-vector-icon-png_260862.jpg',
                    "gender": "female",
                }
            };

            if (!helper.isEmpty(profile.countryCode)) {
                const timezones = momentTimezone.tz.zonesForCountry(profile.countryCode);
                if (!helper.isEmpty(timezones)) {
                    let timezone = timezones[0];
                    let utcOffset = momentTimezone.tz(timezone).utcOffset();
                    data["person"]['timezone'] = utcOffset;
                }
            }

            if (!helper.isEmpty(profile.customerID)) {
                data["person"]['external_id'] = profile.customerID;
            }

            if (!helper.isEmpty(profile.phone) && !helper.isEmpty(profile.phone_code)) {
                data["person"]["phone"] = `${profile.phone_code} ${profile.phone}`
            }

            if (!helper.isEmpty(profile.countryCode)) {
                data["person"]['geolocation'] = {
                    "country": profile.countryCode,
                };
            }

            if (!helper.isEmpty(profile.countryName)) {
                data["person"]["address"] = profile.countryName
            }

            if (!helper.isEmpty(profile.subscriptionDetails) && !helper.isEmpty(profile.subscriptionDetails.planUUID) && !helper.isEmpty(profile.subscriptionDetails.currencyCode)) {

                let planSegments = `${profile.subscriptionDetails.planUUID}_${profile.subscriptionDetails.currencyCode}`
                data["segments"] = [...data.segments, planSegments]
            }

            const apiResponse = await axios.post(addProfileUrl, data, { headers: headerOptions });
            if (apiResponse.data.error == false) {
                const crispPeopleId = apiResponse.data.data.people_id;
                profile['crispPeopleId'] = crispPeopleId
                await _createUserAccountOnCrisp(profile)
            }

        }

        // User logged-In First Time
        if (data.firstLogin) await _saveFirstTimeLoginData(profile)



        // Send Event to Crisp for login information 
        if (!profile.createAccount) {
            await _sendEventToCrispForLogin(profile, 'login', data.firstLogin)
        }




    } catch (error) {
        if (!helper.isEmpty(error.response) && !helper.isEmpty(error.response.data) && (error.response.data.reason == 'people_exists')) {
            console.log('People Already Exists')
            let checkPeopleUrl = `${CONFIG.CRISP_BASE_URL}people/profile/${profile.email}`;
            const checkPeopleResponse = await axios.get(checkPeopleUrl, { headers: headerOptions });
            if (checkPeopleResponse.data.error == false) {
                const crispPeopleId = checkPeopleResponse.data.data.people_id;
                profile['crispPeopleId'] = crispPeopleId


                await _updateUserAccountOnCrisp(profile)

                await _createUserAccountOnCrisp(profile)
            } else {
                console.log('People Not Found')
            }

        }
    }

});


// Trigger when user not active
CrispEvents.on('user-not-active', async (data) => {
    let { crispPeopleId, day, customerID } = data


    if (helper.isEmpty(crispPeopleId) || helper.isEmpty(day)) return

    try {

        let eventName = `inactive_${day}d`

        // // check if event already send or not before the this date send
        // let query = `SELECT COUNT(*) as total FROM crispEvents WHERE crispEvents.customerID = ${customerID} AND crispEvents.eventType = '${helper.getCrispEventByEventName(eventName)}' AND crispEvents.status = 1 AND crispEvents.createdOn > DATE_SUB(NOW(), INTERVAL ${day} DAY)`

        // const result = await CommonFunction.executeQuery(query)

        // if (result[0]?.total != 0) return;


        let eventData = JSON.stringify({
            "text": eventName
        });


        let addEventsUrl = `${CONFIG.CRISP_BASE_URL}people/events/${crispPeopleId}`;

        const apiResponse = await axios.post(addEventsUrl, eventData, { headers: headerOptions });

        if (apiResponse.data.error == false) {
            // event saved then save in database
            let eventType, eventError
            eventType = helper.getCrispEventByEventName(`inactive_${day}d`)
            eventError = null

            let data = {
                eventType: eventType,
                eventError: eventError,
                customerID: customerID,
                status: 1, // 1 for Active,
                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            await _saveEventLogsData(data)
        } else {
            let eventType, eventError
            eventType = helper.getCrispEventByEventName(`inactive_${day}d`)
            eventError = { ...apiResponse }

            let data = {
                eventType: eventType,
                eventError: JSON.stringify(eventError),
                customerID: customerID,
                status: 3, // 3 for failed,
                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            await _saveEventLogsData(data)
        }
    } catch (error) {
        // crisp Errors
        let eventType, eventError
        eventType = helper.getCrispEventByEventName(`inactive_${day}d`)


        if (!helper.isEmpty(error.response)) {
            eventError = { ...error.response.data }
        }

        let data = {
            eventType: eventType,
            eventError: JSON.stringify(eventError),
            customerID: customerID,
            status: 3, // 3 for failed,
            createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
            updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
        }

        await _saveEventLogsData(data)

    }
})


// Trigger when user not completed the onboarding
CrispEvents.on('onboarding-not-completed', async (data) => {

    if (helper.isEmpty(data)) return

    let { customerID, crispPeopleId, day } = data
    if (helper.isEmpty(crispPeopleId) || helper.isEmpty(customerID) || helper.isEmpty(day)) return

    try {
        let eventData = JSON.stringify({
            "text": `onboarding_incomplete`
        });
        let addEventsUrl = `${CONFIG.CRISP_BASE_URL}people/events/${crispPeopleId}`;

        const apiResponse = await axios.post(addEventsUrl, eventData, { headers: headerOptions });

        if (apiResponse.data.error == false) {
            console.log('OnBoarding Event Saved');
            let data = {
                eventType: helper.getCrispEventByEventName(`onboarding_incomplete`),
                eventError: null,
                customerID: customerID,
                status: 1, // 1 for Active,
                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            await _saveEventLogsData(data)
        } else {
            console.log("OnBoarding Event Couldn't Saved !!");
            let data = {
                eventType: helper.getCrispEventByEventName(`onboarding_incomplete`),
                eventError: JSON.stringify(apiResponse),
                customerID: customerID,
                status: 3, // 3 for failed,
                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            await _saveEventLogsData(data)
        }
    } catch (error) {
        // crisp Errors
        let eventType, eventError
        eventType = helper.getCrispEventByEventName(`onboarding_incomplete`)

        if (!helper.isEmpty(error.response)) {
            eventError = { ...error.response.data }
        }

        let data = {
            eventType: eventType,
            eventError: JSON.stringify(eventError),
            customerID: customerID,
            status: 3, // 3 for failed,
            createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
            updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
        }

        await _saveEventLogsData(data)
    }
})


// Trigger when user update his watch time
CrispEvents.on('watch-time-updated', async (data) => {
    let { customerID } = data
    if (helper.isEmpty(customerID)) return

    let {crispPeopleId, showPhases} = await _getCustomerInfo(customerID)

    if (helper.isEmpty(crispPeopleId)) return


    let query = ''

    if (showPhases == 1) {
        query = `SELECT SUM(cllh.closeVideoLengthAt) as totalWatchTime FROM customerLibraryLessonHistory cllh WHERE cllh.customerID = ${customerID}`
    } else {
        query = `SELECT SUM(cllh.closeVideoLengthAt) as totalWatchTime FROM customerLibraryLessonHistory cllh WHERE cllh.customerID = ${customerID} AND cllh.isAssignedVideo = 1`
    }

    sql.query(query, async (error, watchTimeResult) => {
        if (error) {
            console.log('Error in getting crispEvents')
            let data = {
                eventType: 0,
                eventError: JSON.stringify(error),
                customerID: customerID,
                status: 3, // 3 for failed,
                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            await _saveEventLogsData(data)
        } else {
            let totalWatchTime = watchTimeResult[0].totalWatchTime

            let eventType = '', eventName = ''
            if (totalWatchTime >= 30 * 60 && totalWatchTime < 100 * 60) {
                eventType = helper.getCrispEventByEventName('power_30min')
                eventName = 'power_30min'
            } else if (totalWatchTime >= 100 * 60 && totalWatchTime < 200 * 60) {
                eventType = helper.getCrispEventByEventName('power_100min')
                eventName = 'power_100min'
            } else if (totalWatchTime >= 200 * 60) {
                eventType = helper.getCrispEventByEventName('power_200min')
                eventName = 'power_200min'
            } else {
                eventType = ''
            }

            if (helper.isEmpty(eventType)) return
            if (helper.isEmpty(eventName)) return

            let query = `SELECT COUNT(*) as total FROM crispEvents WHERE crispEvents.customerID = ${customerID} AND crispEvents.eventType = '${eventType}' AND crispEvents.status = 1`

            sql.query(query, async (error, eventResult) => {
                if (error) {
                    console.log('Error in getting crispEvents')
                    let data = {
                        eventType: eventType,
                        eventError: JSON.stringify(error),
                        customerID: customerID,
                        status: 3, // 3 for failed,
                        createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                        updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                    }
                    await _saveEventLogsData(data)
                } else {
                    if (eventResult && eventResult[0] && eventResult[0].total != 0) return;

                    try {
                        let addEventsUrl = `${CONFIG.CRISP_BASE_URL}people/events/${crispPeopleId}`;
                        let eventData = JSON.stringify({
                            "text": eventName
                        });
                        const apiResponse = await axios.post(addEventsUrl, eventData, { headers: headerOptions });

                        if (apiResponse.data.error == false) {
                            console.log(`${eventName} Event Saved`);
                            let data = {
                                eventType: eventType,
                                eventError: null,
                                customerID: customerID,
                                status: 1, // 1 for Active,
                                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                            }
                            await _saveEventLogsData(data)
                        } else {
                            console.log(`${eventName} Event Couldn't Saved !!`);
                            let data = {
                                eventType,
                                eventError: JSON.stringify(apiResponse),
                                customerID: customerID,
                                status: 3, // 3 for failed,
                                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                            }
                            await _saveEventLogsData(data)
                        }
                    } catch (error) {
                        let data = {
                            eventType,
                            eventError: JSON.stringify(error),
                            customerID: customerID,
                            status: 3, // 3 for failed,
                            createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                            updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                        }
                        await _saveEventLogsData(data)

                    }
                }
            })

        }
    })


    // let query = `SELECT COUNT(*) as total FROM crispEvents WHERE crispEvents.customerID = ${customerID} AND crispEvents.eventType = '${eventType}' AND crispEvents.status = 1`

    // sql.query(query, async (error, result) => {
    //     if (error) {
    //         console.log('Error in getting crispEvents')
    //         let data = {
    //             eventType: eventType,
    //             eventError: JSON.stringify(error),
    //             customerID: customerID,
    //             status: 3, // 3 for failed,
    //             createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
    //             updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
    //         }
    //         await _saveEventLogsData(data)
    //     } else {
    //         console.log('Total Watch Time', result)
    //         if (result.length > 0 && result[0].total == 0) {
    //             // send event to crisp
    //             // get total watch time of customer
    //             let query = `SELECT SUM(cllh.closeVideoLengthAt) as totalWatchTime FROM customerLibraryLessonHistory cllh WHERE cllh.customerID = ${customerID} AND cllh.isAssignedVideo = 1`

    //             sql.query(query, async (error, result) => {
    //                 if (error) {
    //                     console.log('Error in getting crispEvents')
    //                     let data = {
    //                         eventType: eventType,
    //                         eventError: JSON.stringify(error),
    //                         customerID: customerID,
    //                         status: 3, // 3 for failed,
    //                         createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
    //                         updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
    //                     }
    //                     await _saveEventLogsData(data)
    //                 } else {
    //                     console.log('Total Watch Time', result)
    //                     if (result.length > 0 && result[0].totalWatchTime) {
    //                         let totalWatchTime = result[0].totalWatchTime
    //                         let totalWatchTimeInMin = Math.round(totalWatchTime / 60)


    //                         if (totalWatchTimeInMin >= watchTime) {
    //                             let eventData = JSON.stringify({
    //                                 "text": `power_100min`
    //                             });
    //                             let addEventsUrl = `${CONFIG.CRISP_BASE_URL}people/events/${crispPeopleId}`;

    //                             const apiResponse = await axios.post(addEventsUrl, eventData, { headers: headerOptions });

    //                             if (apiResponse.data.error == false) {
    //                                 console.log('Power 100min Event Saved');
    //                                 let data = {
    //                                     eventType: helper.getCrispEventByEventName(`power_100min`),
    //                                     eventError: null,
    //                                     customerID: customerID,
    //                                     status: 1, // 1 for Active,
    //                                     createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
    //                                     updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
    //                                 }
    //                                 await _saveEventLogsData(data)
    //                             } else {
    //                                 console.log("Power 100min Event Couldn't Saved !!");
    //                                 let data = {
    //                                     eventType: helper.getCrispEventByEventName(`power_100min`),
    //                                     eventError: JSON.stringify(apiResponse),
    //                                     customerID: customerID,
    //                                     status: 3, // 3 for failed,
    //                                     createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
    //                                     updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
    //                                 }
    //                                 await _saveEventLogsData(data)
    //                             }
    //                         }
    //                     }
    //                 }
    //             })
    //         } else {
    //             console.log('Event already send')
    //         }
    //     }
    // })

});


// TRIGGER EVENT ON CUSTOMER LIBRARY PURCHASE
CrispEvents.on('library-purchase', async (data) => {
    let { purchaseType, customerID, currencySymbol } = data


    if (helper.isEmpty(customerID) || helper.isEmpty(purchaseType) || helper.isEmpty(currencySymbol)) return

    let {crispPeopleId} = await _getCustomerInfo(customerID)

    if (helper.isEmpty(crispPeopleId)) return

    try {
        let crispPeopleUrl = `${CONFIG.CRISP_BASE_URL}people/profile/${crispPeopleId}`;

        let apiResponse = await axios.get(crispPeopleUrl, { headers: headerOptions });

        if (apiResponse.data.error == false) {
            let segments = apiResponse.data.data.segments

            let segmentsArray = [...segments]

            if (purchaseType == 'one-time') {
                segmentsArray = [...segmentsArray, `library_1-time_${currencySymbol}`]
            } else if (purchaseType == 'quaterly') {
                segmentsArray = [...segmentsArray, `library_qtrly_${currencySymbol}`]
            } else if (purchaseType == 'yearly') {
                segmentsArray = [...segmentsArray, `library_annual_${currencySymbol}`]
            } else {
                segmentsArray = [...segmentsArray, `library_monthly_${currencySymbol}`]
            }

            let data = {
                "segments": segmentsArray
            }


            let updateProfileUrl = `${CONFIG.CRISP_BASE_URL}people/profile/${crispPeopleId}`;

            const updateApiResponse = await axios.patch(updateProfileUrl, data, { headers: headerOptions });

            if (updateApiResponse.data.error == false) {
                console.log('Segments Updated')

                let segmentName = ''

                if (purchaseType == 'one-time') {
                    segmentName = `oneTime-Segment`
                } else if (purchaseType == 'quaterly') {
                    segmentName = `quaterly-Segment`
                } else if (purchaseType == 'yearly') {
                    segmentName = `yearly-Segment`
                } else {
                    segmentName = `monthly-Segment`
                }

                let data = {
                    eventType: helper.getCrispEventByEventName(segmentName),
                    eventError: null,
                    customerID: customerID,
                    status: 1, // 1 for Active,
                    createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                }

                await _saveEventLogsData(data)
            } else {
                console.log("Segments Couldn't Updated !!");

                let segmentName = ''

                if (purchaseType == 'one-time') {
                    segmentName = `oneTime-Segment`
                } else if (purchaseType == 'quaterly') {
                    segmentName = `quaterly-Segment`
                } else if (purchaseType == 'yearly') {
                    segmentName = `yearly-Segment`
                } else {
                    segmentName = `monthly-Segment`
                }
                let data = {
                    eventType: helper.getCrispEventByEventName(segmentName),
                    eventError: JSON.stringify(updateApiResponse),
                    customerID: customerID,
                    status: 3, // 3 for failed,
                    createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                }
                await _saveEventLogsData(data)
            }
        } else {
            console.log("People Not Found")

            let segmentName = ''

            if (purchaseType == 'one-time') {
                segmentName = `oneTime-Segment`
            } else if (purchaseType == 'quaterly') {
                segmentName = `quaterly-Segment`
            } else if (purchaseType == 'yearly') {
                segmentName = `yearly-Segment`
            } else {
                segmentName = `monthly-Segment`
            }
            let data = {
                eventType: helper.getCrispEventByEventName(segmentName),
                eventError: JSON.stringify(updateApiResponse),
                customerID: customerID,
                status: 3, // 3 for failed,
                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            await _saveEventLogsData(data)

        }

    } catch (error) {
        let eventType, eventError

        let segmentName = ''

        if (purchaseType == 'one-time') {
            segmentName = `oneTime-Segment`
        } else if (purchaseType == 'quaterly') {
            segmentName = `quaterly-Segment`
        } else if (purchaseType == 'yearly') {
            segmentName = `yearly-Segment`
        } else {
            segmentName = `monthly-Segment`
        }

        eventType = helper.getCrispEventByEventName(segmentName)
        eventError = { ...error }

        let data = {
            eventType: eventType,
            eventError: JSON.stringify(eventError),
            customerID: customerID,
            status: 3, // 3 for failed,
            createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
            updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
        }
        await _saveEventLogsData(data)
    }



})

// TRIGGER THE EVENT WHEN USER PURCHASE THE LIVE CLASS

CrispEvents.on('live-class-purchase', async (data) => {
    let { classType, customerID, currencyCode } = data

    if (helper.isEmpty(customerID) || helper.isEmpty(classType) || helper.isEmpty(currencyCode)) return

    let {crispPeopleId} = await _getCustomerInfo(customerID)

    if (helper.isEmpty(crispPeopleId)) return

    let segmentName = ''

    if (classType == '1') {
        segmentName = `liveclass_1-time`
    } else if (classType == '2') {
        segmentName = `liveclass_4-pack`
    } else {
        segmentName = `liveclass`
    }
    try {

        let crispPeopleUrl = `${CONFIG.CRISP_BASE_URL}people/profile/${crispPeopleId}`;

        let apiResponse = await axios.get(crispPeopleUrl, { headers: headerOptions });

        if (apiResponse.data.error == false) {
            let segments = apiResponse.data.data.segments

            let segmentsArray = [...segments]

            segmentsArray = [...segmentsArray, `${segmentName}_${currencyCode}`]

            let data = {
                "segments": segmentsArray
            }

            let updateProfileUrl = `${CONFIG.CRISP_BASE_URL}people/profile/${crispPeopleId}`;

            const updateApiResponse = await axios.patch(updateProfileUrl, data, { headers: headerOptions });


            if (updateApiResponse.data.error == false) {
                console.log('Segments Updated Live Class')
                let data = {
                    eventType: helper.getCrispEventByEventName(segmentName),
                    eventError: null,
                    customerID: customerID,
                    status: 1, // 1 for Active,
                    createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                }

                await _saveEventLogsData(data)
            } else {
                console.log("Live Class Segments Couldn't Updated !!");

                let data = {
                    eventType: helper.getCrispEventByEventName(segmentName),
                    eventError: JSON.stringify(updateApiResponse),
                    customerID: customerID,
                    status: 3, // 3 for failed,
                    createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                }
                await _saveEventLogsData(data)
            }


        } else {
            console.log("People Not Found")
            let data = {
                eventType: helper.getCrispEventByEventName(segmentName),
                eventError: JSON.stringify(apiResponse),
                customerID: customerID,
                status: 3, // 3 for failed,
                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            await _saveEventLogsData(data)
        }

    } catch (error) {
        let eventType, eventError

        eventType = helper.getCrispEventByEventName(segmentName)
        eventError = { ...error }

        let data = {
            eventType: eventType,
            eventError: JSON.stringify(eventError),
            customerID: customerID,
            status: 3, // 3 for failed,
            createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
            updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
        }
        await _saveEventLogsData(data)
    }
})

// CHECK AND SAVE - FIRST TIME LOGIN DATA INTO CRISP
const _saveFirstTimeLoginData = (userProfile) => {
    return new Promise(async (resolve, reject) => {

        try {
            let { crispPeopleId } = userProfile
            let eventData = JSON.stringify({
                "text": "first_login"
            });

            let addEventsUrl = `${CONFIG.CRISP_BASE_URL}people/events/${crispPeopleId}`;

            const apiResponse = await axios.post(addEventsUrl, eventData, { headers: headerOptions });

            if (apiResponse.data.error == false) {
                console.log('First Login Event Saved');
                let data = {
                    eventType: helper.getCrispEventByEventName(`first_login`),
                    eventError: null,
                    customerID: userProfile.customerID,
                    status: 1, // 1 for Active,
                    createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                }
                await _saveEventLogsData(data)
                resolve(true)
            } else {
                console.log("First Login Event Couldn't Saved !!");
                let data = {
                    eventType: helper.getCrispEventByEventName(`first_login`),
                    eventError: JSON.stringify(apiResponse),
                    customerID: userProfile.customerID,
                    status: 3, // 3 for failed,
                    createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                }
                await _saveEventLogsData(data)
                resolve(false)
            }
        } catch (error) {

            let eventType, eventError
            eventType = helper.getCrispEventByEventName(`first_login`)
            if (!helper.isEmpty(error.response)) {
                eventError = { ...error.response.data }
            }

            let data = {
                eventType: eventType,
                eventError: JSON.stringify(eventError),
                customerID: userProfile.customerID,
                status: 3, // 3 for failed,
                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
            }

            await _saveEventLogsData(data)
            resolve(false)
        }

    })
}


// SEND EVENT TO CRISP FOR LOGIN IF CUSTOMER LOGIN AFTER 7 DAYS
const _sendEventToCrispForLogin = (userProfile, event, firstLogin) => {
    return new Promise(async (resolve, reject) => {
        const { customerID, crispPeopleId } = userProfile

        let customerLogin = {}
        customerLogin.table = 'loginHistory'
        customerLogin.column = ['createdOn']
        customerLogin.where = { customerID: customerID }
        customerLogin.orderBy = 'createdOn'
        customerLogin.order = 'DESC'

        let loginHistory = await CommonFunction.getAllRecordsOnly(customerLogin)


        if (!helper.isEmpty(loginHistory.err)) {
            resolve(loginHistory.err)
        } else {
            let eventName = ''
            if (loginHistory.data.length == 1 && firstLogin != true) {
                console.log('First Login')
                eventName = 'first_login'
            } else if (loginHistory.data.length >= 2) {
                let lastLogin = moment(loginHistory.data[1].createdOn).format('YYYY-MM-DD')
                let today = moment().format('YYYY-MM-DD')
                let diff = moment(today).diff(moment(lastLogin), 'days')
                if (diff >= 7) {
                    eventName = 'relogin7d'
                } else {
                    if (true) {   // loginHistory.data.length >= 4
                        let firstLoginDate = loginHistory.data[0].createdOn
                        let secondLoginDate = loginHistory.data[1]?.createdOn
                        let thirdLoginDate = loginHistory.data[2]?.createdOn
                        let fourthLoginDate = loginHistory.data[3]?.createdOn

                        firstLoginDate = moment(firstLoginDate).format('YYYY-MM-DD')
                        secondLoginDate = moment(secondLoginDate).format('YYYY-MM-DD')
                        thirdLoginDate = moment(thirdLoginDate).format('YYYY-MM-DD')
                        fourthLoginDate = moment(fourthLoginDate).format('YYYY-MM-DD')


                        // check if last 4 login dates are in a row
                        let firstDiff = moment(firstLoginDate).diff(moment(secondLoginDate), 'days')
                        let secondDiff = moment(secondLoginDate).diff(moment(thirdLoginDate), 'days')
                        let thirdDiff = moment(thirdLoginDate).diff(moment(fourthLoginDate), 'days')


                        if (firstDiff == 1 && secondDiff == 1 && thirdDiff == 1) {
                            eventName = 'login_4x_user'
                        }
                    }
                }
            } else {
                eventName = ''
            }

            if (!helper.isEmpty(eventName)) {

                // Check if event is already send or not
                let query = `SELECT COUNT(*) as total FROM crispEvents WHERE crispEvents.customerID = ${customerID} AND crispEvents.eventType = '${helper.getCrispEventByEventName(eventName)}' AND crispEvents.status = 1`

                let result = await CommonFunction.executeQuery(query)

                if (!helper.isEmpty(result.err)) {
                    let data = {
                        eventType: helper.getCrispEventByEventName(eventName),
                        eventError: JSON.stringify(result.err),
                        customerID: customerID,
                        status: 3, // 1 for Active,
                        createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                        updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                    }
                    await _saveEventLogsData(data)
                    resolve(true)
                } else {
                    if ((result && result.data[0] && result.data[0].total == 0 )|| eventName == 'relogin7d') {
                        let eventData = JSON.stringify({
                            "text": eventName
                        });

                        let addEventsUrl = `${CONFIG.CRISP_BASE_URL}people/events/${crispPeopleId}`;

                        const apiResponse = await axios.post(addEventsUrl, eventData, { headers: headerOptions });

                        if (apiResponse.data.error == false) {
                            console.log(`${helper.getCrispEventByEventName(eventName)} is saved.`);
                            let data = {
                                eventType: helper.getCrispEventByEventName(eventName),
                                eventError: null,
                                customerID: customerID,
                                status: 1, // 1 for Active,
                                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                            }
                            await _saveEventLogsData(data)
                            resolve(true)
                        } else {
                            console.log(`${helper.getCrispEventByEventName(eventName)} is not saved.`);
                            let data = {
                                eventType: helper.getCrispEventByEventName(eventName),
                                eventError: JSON.stringify(apiResponse),
                                customerID: customerID,
                                status: 3, // 3 for failed,
                                createdOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                                updatedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                            }
                            await _saveEventLogsData(data)
                            resolve(false)
                        }
                    }
                }
            } else {
                resolve(true)
            }
        }
    })
}

const _createUserAccountOnCrisp = (profile) => {
    return new Promise(async (resolve, reject) => {
        let info = {}
        info.table = 'customer'
        info.data = {
            crispPeopleId: profile.crispPeopleId
        }
        info.where = { customerID: profile.customerID }

        let updateRecord = await CommonFunction.updateValidRecord(info.table, info.data, info.where);

        if (!helper.isEmpty(updateRecord.err)) {
            console.log('People ID not inserted in customer table')
        } else {
            console.log('People ID save in customer table');

        }
        let customerName = `${(!helper.isEmpty(profile.firstName) ? profile.firstName : '')} ${(!helper.isEmpty(profile.lastName) ? profile.lastName : '')}`;
        // after generating the people id, we will set custom data in crisp
        const addCustomDataUrl = `${CONFIG.CRISP_BASE_URL}people/data/${profile.crispPeopleId}`
        let customdata = {
            data: {
                "Name": customerName,
                "Email": profile.email,
            }

        }
        if (!helper.isEmpty(profile.phone) && !helper.isEmpty(profile.phone_code)) {
            customdata["data"]["PhoneNumber"] = `${profile.phone_code} ${profile.phone}`
        }

        if (!helper.isEmpty(profile.countryName)) {
            customdata["data"]["Country"] = profile.countryName
        }

        if (!helper.isEmpty(profile.subscriptionDetails) && !helper.isEmpty(profile.subscriptionDetails.planName)) {
            customdata["data"]["ProductName"] = profile.subscriptionDetails.planName
        }

        if (!helper.isEmpty(profile.subscriptionDetails) && !helper.isEmpty(profile.subscriptionDetails.subscriptionAmount) && !helper.isEmpty(profile.subscriptionDetails.currencySymobl)) {
            customdata["data"]["ProductValue"] = `${profile.subscriptionDetails.subscriptionAmount} ${profile.subscriptionDetails.currencySymobl}`
        }

        if (!helper.isEmpty(profile.subscriptionDetails) && !helper.isEmpty(profile.subscriptionDetails.couponCode)) {
            customdata["data"]["Coupon"] = profile.subscriptionDetails.couponCode
        }

        if (!helper.isEmpty(profile.subscriptionDetails) && !helper.isEmpty(profile.subscriptionDetails.createdOn)) {
            customdata["data"]["PurchaseDate"] = moment(profile.subscriptionDetails.createdOn).format('MMM DD, YYYY')
        }

        const customDataResponse = await axios.put(addCustomDataUrl, customdata, { headers: headerOptions });

        if (customDataResponse.data.error == false) {
            resolve()
            console.log('Custom Data Saved');
        } else {
            resolve()
            console.log("Custom Data Couldn't Saved !!");
        }
    })

}


const _updateUserAccountOnCrisp = (profile) => {
    return new Promise(async (resolve, reject) => {

        let updatePeopleUrl = `${CONFIG.CRISP_BASE_URL}people/profile/${profile.crispPeopleId}`;

        let customerName = `${(!helper.isEmpty(profile.firstName) ? profile.firstName : '')} ${(!helper.isEmpty(profile.lastName) ? profile.lastName : '')}`;


        let data = {
            "email": profile.email,
            "name": customerName,
            "segments": [],
            "avatar": !helper.isEmpty(profile.photourl) ? profile.photourl : 'https://png.pngtree.com/element_our/png/20181206/users-vector-icon-png_260862.jpg',
            "person": {
                "nickname": customerName,
                "avatar": !helper.isEmpty(profile.photourl) ? profile.photourl : 'https://png.pngtree.com/element_our/png/20181206/users-vector-icon-png_260862.jpg',
                "gender": "female",
            }
        };

        if (!helper.isEmpty(profile.countryCode)) {
            const timezones = momentTimezone.tz.zonesForCountry(profile.countryCode);
            if (!helper.isEmpty(timezones)) {
                let timezone = timezones[0];
                let utcOffset = momentTimezone.tz(timezone).utcOffset();
                console.log(utcOffset);
                data["person"]['timezone'] = utcOffset;
            }
        }

        if (!helper.isEmpty(profile.customerID)) {
            data["person"]['external_id'] = profile.customerID;
        }

        if (!helper.isEmpty(profile.phone) && !helper.isEmpty(profile.phone_code)) {
            data["person"]["phone"] = `${profile.phone_code} ${profile.phone}`
        }

        if (!helper.isEmpty(profile.countryName)) {
            data["person"]["address"] = profile.countryName
        }

        console.log("******************************************")
        console.log(profile)
        console.log("******************************************")

        if (!helper.isEmpty(profile.subscriptionDetails) && !helper.isEmpty(profile.subscriptionDetails.planUUID) && !helper.isEmpty(profile.subscriptionDetails.currencyCode)) {
            let planSegments = `${profile.subscriptionDetails.planUUID}_${profile.subscriptionDetails.currencyCode}`
            data["segments"] = [...data.segments, planSegments]
        }

        if (!helper.isEmpty(profile.countryCode)) {
            data["person"]['geolocation'] = {
                "country": profile.countryCode,
            };
        }



        const apiResponse = await axios.patch(updatePeopleUrl, data, { headers: headerOptions });
        if (apiResponse.data.error == false) {
            console.log('People Updated');
            resolve()
        } else {
            resolve()
        }
    })
}

// SAVE EVENT ERROR
const _saveEventLogsData = (data) => {
    return new Promise((resolve, reject) => {
        let info = {}
        info.table = 'crispEvents'
        info.data = data
        CommonFunction.insertValidRecord(info.table, info.data, (error, result) => {
            if (error) {
                resolve(error)
            } else {
                resolve(result)
            }
        })
    })
}

const _getCustomerInfo = (customerID) => {
    return new Promise(async (resolve, reject) => {
        let info = {}
        info.table = 'customer'
        info.column = ['crispPeopleId', 'showPhases']
        info.where = { customerID: customerID }
        let customerInfo = await CommonFunction.getAllRecordsOnly(info)

        if (!helper.isEmpty(customerInfo.err)) {
            resolve(null)
        } else {
            if (customerInfo.data.length > 0) {
                resolve({

                    crispPeopleId: customerInfo.data[0].crispPeopleId,
                    showPhases: customerInfo.data[0].showPhases
                })
            } else {
                resolve(null)
            }
        }
    })
}


module.exports = CrispEvents;