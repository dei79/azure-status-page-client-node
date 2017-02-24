let MeterManager = require('../index.js').MeterManager;

// Just define the meter ids
let webJobMeter = '20C8CFBC-4669-45E5-9090-124A28D3942E';
let diskSpaceMeter = '4047A057-E2EF-44AC-B0E3-341EAF0ED09D';

//
// This section shows how to define meters in the framework
//

// Register a specific meter which expect a heartbeat every 500 seconds, good to observe continous background worker listening on a queue
MeterManager.RegisterMeter(webJobMeter, 'Spending Data Processing', 'Background Processing', MeterManager.MeterTypes.Heartbeat, 500);

// Register a specific meter which expect that the value will not become less then the specific min value, good for observing diskspace or something like that
MeterManager.RegisterMeter(diskSpaceMeter, 'Free Diskspace for Caching', 'Caching', MeterManager.MeterTypes.MinValue, 10 * 1024 * 1024 * 1024);

//
// This section shows how to configure the right storage for the meter manager
// Check: credentials-sample.json for structure
//
const credentials = require('../.credentials.json');
MeterManager.ConfigureAzureTableStoreRepository(credentials.storage01.key, credentials.storage01.secret);

//
// This section shows how to update a specific instance of a meter
//
console.log("Updating meters");
MeterManager.UpdateMeter(webJobMeter, 'Node12237.WebJob.01').then(() => {

    MeterManager.UpdateMeter(diskSpaceMeter, 'Node12237', 14 * 1024 * 1024 * 1024).then(() => {

        console.log("Updated all meters");
        process.exit(0);
    });
}).catch((e) => {
    console.log(e);
    process.exit(-1);
});