//DoTu 20241030

const request = require('./request-0.0.4.js');
let self = this;

async function sendMeassage() {
// Read machine data1
let machineData_uShort = await driver.promises.getData(self.config.machineData_uShort, 10);
//console.log("Machine data1: ", machineData_uShort.values);

// Read machine data2
let machineData_bool = await driver.promises.getData(self.config.machineData_bool, 10);
//console.log("Machine data2: ", machineData_bool.values);
// Convert 0, 1 to false, true
machineData_bool.values = machineData_bool.values.map(value => {
    return value === "true" || value === 1 || value === "1";
});
//console.log("Machine data converted: ", machineData_bool.values);

// Read machine data3
let machineData_float = await driver.promises.getData(self.config.machineData_float, 10);
//console.log("Machine data3: ", machineData_float.values);


let URL = 'http://127.0.0.1:1880/testNodeRed/?';
URL += '&machineData1='
URL += machineData_uShort.values;
URL += '&machineData2='
URL += machineData_bool.values;
URL += '&machineData3='
URL += machineData_float.values;
 console.log("URL:", URL);

// Send the get request
request.get({
        url: URL
    }, 
    function (error, response, body) {
        //show response
        console.log("Server response:", body);
    }
    )
}



sendMeassage();




