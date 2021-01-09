// This works for the reflashed Mijia Thermometer+Hygrometer
const os = require("os");
const noble = require("@abandonware/noble");
const {program} = require("commander");

let debug = false;
let telegrafMode = false;
let uuid = '181a';
let timeout = 10;
let influxDB='environment';

// sensors is array of Strings with the sensor names
// Get one data item from each sensor

function startScanning(sensors, uuid, telegrafMode, debug) {

    let sensorCount = sensors.length;

    if (sensorCount === 0)
        return;

    noble.on("stateChange", function (state) {
        if (debug) console.log(`StateChanged to ${state}`);
        if (state === "poweredOn") {
            if (debug) console.log('Start scanning');
            noble.startScanning([uuid], true);
        } else {
            if (debug) console.log('Stopped scanning');
            noble.stopScanning();
        }
    });

    noble.on("discover", function (peripheral) {
        if (debug) {
            console.log("Peripheral discovered:");
            console.log(`  Local name is: ${peripheral.advertisement.localName}`);
        }
        if (peripheral.advertisement.localName) {
            for (let sData of peripheral.advertisement.serviceData) {
                let sensorIndex = sensors.indexOf(peripheral.advertisement.localName);
                if (sData.uuid === uuid && sensorIndex != -1) {
                    sensors[sensorIndex] = "";
                    let temperature = sData.data.readIntBE(6, 2) / 10.0;
                    let humidity = sData.data.readUInt8(8);
                    let battery = sData.data.readUInt8(9);
                    if (telegrafMode) {
                        console.log(`${influxDB},host=${os.hostname()},sensor=${peripheral.advertisement.localName} temp=${temperature},humidity=${humidity},battery=${battery}`);
                    } else {
                        let now = new Date().toString();
                        console.log(
                            `${now} ${peripheral.advertisement.localName} T=${temperature}, H=${humidity}% Batt=${battery}%`
                        );
                    }
                    --sensorCount;
                    if (debug) console.log(`Sensors left to get data from: ${sensorCount}`);
                    if (sensorCount == 0) {
                        noble.stopScanning();
                        process.exit(0);
                    }
                }
            }
        }
    });
}

function commaSeparatedList(value, dummyPrevious) {
    return value.split(",");
}

program
    .option("-d, --debug", "Show debug messages")
    .option("-t, --telegraf", "print values for telegraf")
    .option("-u, --uuid <uuid>", "Which service UUID to search for (default: 181a)")
    .option("-s, --sensors <items>", "sensor1,sensor2,...", commaSeparatedList)
    .option("-e, --end <timeout>", "End after at most <timeout> seconds (default: 10)")
    .option("-i, --influxdb <dbname>", "Name of the InfluxDB table (default: environment)");

program.parse(process.argv);
if (!program.sensors) {
    console.log("Error: You must include at least 1 sensor via the --sensors option");
    process.exit(10);
}
if (program.debug) debug = true;
if (program.telegraf) telegrafMode = true;
if (program.uuid) uuid = program.uuid;
if (program.end) timeout = parseInt(program.end);
if (program.influxdb) influxDB = program.influxdb;

if (debug) console.log(`Checking for sensors ${program.sensors}`);

startScanning(program.sensors, uuid, telegrafMode, debug);

setTimeout(() => {
    noble.stopScanning();
    process.exit(1);
}, timeout * 1000);
