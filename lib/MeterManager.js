"use strict";

let q = require('q');
let azureTableClientModule = require('azure-table-client');

class MeterManager {

    constructor() {

        this.MeterTypes = {
            Heartbeat: 1,
            MinValue:  2,
            MaxValue:  3
        };

        this._meterRegistry = [];
        this._meterRegistryHash = {};
    }

    ConfigureAzureTableStoreRepository(storageKey, storageSecret, storageTable) {
        this._storageCredentials = {
            Key: storageKey,
            Secret: storageSecret
        };

        this._storageTable = storageTable ? storageTable : "MeterInformation";
    }

    RegisterMeter(meterId, meterName, meterCategory, meterType, meterDisplayOrder, meterValue) {
        let meter = {
            MeterId: meterId,
            MeterName: meterName,
            MeterCategory: meterCategory,
            MeterType: meterType,
            MeterValue: meterValue,
            MeterDisplayOrder: meterDisplayOrder
        };

        this._meterRegistry.push(meter);
        this._meterRegistryHash[meterId] = meter;
    }

    UpdateMeter(meterId, meterInstanceId, meterInstanceValue) {

        // look up the meterId
        let meter = this._meterRegistryHash[meterId];
        if (!meter) { return q.reject(new Error('Invalid MeterId, please use an existing meter')); }

        // generate a meter instance based on meter
        let meterInstance = JSON.parse(JSON.stringify(meter));
        meterInstance.MeterInstanceId = meterInstanceId;
        meterInstance.MeterInstanceValue = meterInstanceValue;
        meterInstance.MeterInstanceTimestamp = new Date();

        // store the instance value into the table storage
        if (!this._storageCredentials) {
            return q.reject(new Error('Missing storage credentials, please call SetStorageCredentials first'));
        } else {

            // create the table client
            let azureTableClient = new azureTableClientModule.AzureTableClient();

            // set the correct credentials
            azureTableClient.config(this._storageCredentials.Key, this._storageCredentials.Secret);

            // define the model class
            let MeterInstanceModelDefinition = azureTableClient.define({
                MeterId: String,
                MeterName: String,
                MeterCategory: String,
                MeterType: Number,
                MeterDisplayOrder: azureTableClient.DataTypes.Int32,
                MeterValue: Number,
                MeterInstanceId: String,
                MeterInstanceValue: Number,
                MeterInstanceTimestamp: Date,
                PartitionKey: (model) => {
                    return model.MeterId;
                },
                RowKey: (model) => {
                    return model.MeterInstanceId;
                },
                TableName: () => {
                    return this._storageTable;
                }
            });

            // generate the model
            let meterInstanceModel = MeterInstanceModelDefinition.build(meterInstance);

            // store
            return meterInstanceModel.merge();
        }
    }

    RemoveMetersForInstance(meterInstance) {

        // create the table client
        let azureTableClient = new azureTableClientModule.AzureTableClient();

        // set the correct credentials
        azureTableClient.config(this._storageCredentials.Key, this._storageCredentials.Secret);


        // define the model class
        let MeterInstanceModelDefinition = azureTableClient.define({
            MeterId: String,
            MeterInstanceId: String,
            PartitionKey: (model) => {
                return model.MeterId;
            },
            RowKey: (model) => {
                return model.MeterInstanceId;
            },
            TableName: () => {
                return this._storageTable;
            }
        });

        // build the models to remove
        let modelsToRemove = [];
        Object.keys(this._meterRegistryHash).forEach((k) => {
            modelsToRemove.push(MeterInstanceModelDefinition.build({MeterId: k, MeterInstanceId: meterInstance}));
        });

        // remove
        return MeterInstanceModelDefinition.deleteMultiplePartitions(modelsToRemove);
    }
}

module.exports = new MeterManager();