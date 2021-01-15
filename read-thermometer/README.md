# Read data from reflashed LYWSD03MMC

This short Node.js program reads environment data
(temperature, humidity and also battery status)
via the BLE announcements from the reflashed LYWSD03MMC.
See https://github.com/atc1441/ATC_MiThermometer

## Usage

```
❯ npm install
[...]
❯ node read-thermometer.js -s ATC_C1CADA,ATC_D01337 -e 10 -t
environment,host=m75q,sensor=ATC_1B96D4 temp=22.5,humidity=37,battery=100
environment,host=m75q,sensor=ATC_AA74AD temp=22.7,humidity=37,battery=100
```
The program terminates once data was received from all sensors, or latest
after 10s (default), whichever is earlier. Typical run time is below 5s.

The needed snippet for telegraf.conf:
```
[[inputs.exec]]
  commands = ["~/bin/mijia-thermometer.sh"]
  timeout = "12s"
  data_format = "influx"
```
with the mijia-thermometer.sh script containing the above node command.

### Options

```
❯ node read-thermometer.js -h
Usage: read-thermometer [options]

Options:
  -d, --debug              Show debug messages
  -t, --telegraf           print values for telegraf
  -u, --uuid <uuid>        Which service UUID to search for (default: 181a)
  -s, --sensors <items>    sensor1,sensor2,...
  -e, --end <timeout>      End after at most timeout seconds (default: 10)
  -i, --influxdb <dbname>  Name of the InfluxDB table (default: environment)
  -h, --help               display help for command
```

### Notes

node needs to have permission to to raw connecta to the network, so either use sudo:
```
❯ sudo node find-thermometer.js
```
or set capabilities for the node binary to allow raw connects to the network:
```
❯ sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```
and then you don't need sudo anymore.
