const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
const http = require("http");
const url = "http://news.baidu.com/";
const async = require("async")
// http.get(url, (res) => {
//     let rowData = ''
//     res.on("data", (chunk) => {
//         rowData += chunk
//     });
//     res.on("end", () => {
//         // console.log(rowData)
//         // let parsedData = JSON.parse(rowData);
//         // console.log(parsedData);
//         var $ = cheerio.load(rowData);
//         console.log($);
//         Array.from($("#channel-all li")).forEach(x => {
//             console.log($(x).text())
//         })
//     })
// })
let config={}
let obj = {test1: "./test1.json", test2:"./test2.json"};
// async.forEachOf 和forEach的区别: async.forEachOf同时发请求   请求时间是时间最长的那个请求   forEach则是一个一个来  请求时间是所有请求时间的总和
// async.forEachOfLimit(obj,1, (value, key, callback) => {
//     fs.readFile(value, "utf-8", (err,data) => {
//         if(err) callback(err)
//         try{
//             config[key] = JSON.parse(data);
//             console.log(config)
//         }catch(e){
//             callback(e)
//         }
//     })
    
// }, (err) => {
//     console.log(err)
// })

// async.forEachOfLimit
async.mapLimit([{name:'test1', url: "./test1.json"}, {name: "test2", url: "./test2.json"}, {name: "test3", url: "./test2.json"}, {name: "test4", url: "./test2.json"}], 2, (cur, callback) => {
    fs.readFile(cur.url, "utf-8", (err,data) => {
        if(err) callback(err);
        callback(null,[{url, data}] )
        
    })
    // callback(null, config)
}, (err,result) => {
    console.log(result)
})