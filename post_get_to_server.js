const request = require('./tutorial-webrequest_request-0.0.3.js');
const decoder = new TextDecoder(); // utf-8
let self = this;

// Read machine data1
let machineData_uShort16 = await driver.promises.getData(this.config.machineData_uShort16, 10);
console.log("Machine data1: ", machineData_uShort16.values);

// Read machine data2
let machineData_bool = await driver.promises.getData(this.config.machineData_bool, 10);
console.log("Machine data2: ", machineData_bool.values);

// Read machine data3
let machineData_float = await driver.promises.getData(this.config.machineData_float, 10);
console.log("Machine data3: ", machineData_float.values);


async function sendMeassage() {
let URL = 'http://127.0.0.1:1880/testNodeRed/?';

URL = URL + machineData_uShort16.values;

 console.log("zapytanie:", URL_);
// Send the get request
request.get({
        url: URL_
    }, 
    function (error, response, body) {
        // wypisanie w konsoli zwróconej przez RUT odpowiedzi
        console.log("body:", body);
    }
    )
}

// wywołąnie funkcji (wysłanie do RUT URL z koemndą wysłąnia wiadomości)
sendMeassage();





