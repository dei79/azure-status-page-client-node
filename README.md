# Azure Status Page - Client for Node.js

Please find more information about the Azure Status Page Generator in the following repository. This 
repository cotains the code for the NodeJs client to send meter information from a node application to the Status Page. 

Azure Status Page Generator: https://github.com/dei79/azure-status-page

## Usage

**Step 1: Load the Meter Manager**
The Meter Manager is the single object which will be used to register and update new meters for the Status Page.

```js
let MeterManager = require('../index.js').MeterManager;
```

**Step 2: Define all supported Meters**
Define all supported Meters your application wants to send update notifications to the Status Page. In the 
first place the Status Page aggregates all meters in the same category as one service group in the status page.

```js
// Just define the meter ids
let webJobMeter    = '20C8CFBC-4669-45E5-9090-124A28D3942E';
let diskSpaceMeter = '4047A057-E2EF-44AC-B0E3-341EAF0ED09D';

// Register a specific meter which expect a heartbeat every 500 seconds, good to observe continous background worker listening on a queue
MeterManager.RegisterMeter(webJobMeter, 'Spending Data Processing', 'Background Processing', MeterManager.MeterTypes.Heartbeat, 500);

// Register a specific meter which expect that the value will not become less then the specific min value, good for observing diskspace or something like that
MeterManager.RegisterMeter(diskSpaceMeter, 'Free Diskspace for Caching', 'Caching', MeterManager.MeterTypes.MinValue, 10 * 1024 * 1024 * 1024);
```

**Step 3: Configure the correct Azure Storage Account**
The Status Page Generator relies totally on Azure Storage which means the MeterManager must be configured correctly with a 
set on storage credentials. Optional a tablename can be provided as well.

```js
MeterManager.ConfigureAzureTableStoreRepository('<<STORAGENAME>>', '<<STORAGESECRET>>');
```
**Step 4: Update Meters where ever is necessar**
Just update the meter where ever it makes sense, e.g. when a job is waiting for messages from a queue or when you are maintaining 
the cache from time to time. Calling UpdateMeter without any value means just the timestamp will be updated which is good for 
HeartBeat meters.

Every Meter can be used on different instances, threads and/or nodes. Because of that you need to provide a MeterInstanceId. The 
Status Page is aggregating the different instances to one status and allows you to dig into the root cause on a specific instance. 

```js
MeterManager.UpdateMeter(webJobMeter, 'Node12237.WebJob.01').then(() => {
    MeterManager.UpdateMeter(diskSpaceMeter, 'Node12237', 14 * 1024 * 1024 * 1024).then(() => {
        // DONE
    });
}).catch((e) => {
    // PROCESS ERROR 
});
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :)
