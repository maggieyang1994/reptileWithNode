const axios = require("axios");
const cheerio = require("cheerio");
const async = require("async");
const domin = "https://www.tohomh123.com"
const mysql = require("promise-mysql");
const fs = require("fs")
let pool = mysql.createPool({
    host: '193.112.111.124',
    user: "dev",
    password: "pwd",
    database: "yirenzhixia"
})

// 拿到列表页面

// let getList = () => {
//     let lists = [];
//     return new Promise((resolve, reject) => {
//         axios.get("https://www.tohomh123.com/yirenzhixia/").then((res) => {
//             let $ = cheerio.load(res.data);
//             let list = $(".view-win-list li");
//             Array.from(list).forEach((x, index) => {
//                 let chapter = $(x).find("a").text();
//                 let link = $(x).find("a").attr("href");
//                 if (!(lists.length && lists.map(x => x.link).includes(link))) lists.push({chapter, link })

//             })
//             lists = lists.reverse();
//             resolve(lists)
//         })
//     })

// }
// getList().then(res => {
//     let list = []
//     for(let i =0;i<=3;i++){
//         let sqlStr = `insert into yirenzhixia.directory(id, chapter) values (${i + 1}, '${res[i].chapter}')`
//         list.push(pool.query(sqlStr))
//     }
//     Promise.all(list).then(data => {
//         console.log(data)
//     })
// })



let lists = []

axios.get("https://www.tohomh123.com/yirenzhixia/").then((res) => {
    let $ = cheerio.load(res.data);
    let list = $(".view-win-list li");
    Array.from(list).reverse().forEach((x, index) => {
        let chapter = $(x).find("a").text();
        let link = $(x).find("a").attr("href");
        if (!(lists.length && lists.map(x => x.link).includes(link))) {
            lists.push({ chapter, link })
            let sqlStr = `insert into yirenzhixia.directory(id, chapter) values(${index + 1}, '${chapter}')`
            // 有插入失败的情况
            pool.query(sqlStr).then(res => {
                console.log(`insert ${res.serverStatus === 2 ? 'success' : 'error'}: ${index + 1}-${chapter}`)
            })
        }
    })
    // lists = lists.reverse();
    // // 通过列表 页面去 详情页面拿图片
    // async.mapLimit(lists, 5, (list, callback) => {
    //     axios.get(domin + list.link).then(page => {
    //         let imageList = []
    //         let $page = cheerio.load(page.data);
    //         // 图片有规律  拿到章节  和图片的总数
    //         let total = $page(".header h1.title span").text().match(/\(\d+\/(\d+)\)/);
    //         console.log(list)
    //         total = total && total[1];
    //         // 每个章节的所有列表
    //         let realPage = list.link.match(/\d+(?=\.html)/);
    //         realPage = realPage && realPage[0]
    //         axios.get(`https://www.tohomh123.com/action/play/read?did=7155&sid=${realPage}&iid=2&tmp=0.6582881420326125`).then(data => {
    //             // 返回图片地址
    //             let code = data.data.Code.match(/\d+(?=\.jpg)/);
    //             code = code && code[0]
    //             // 根据地址 找到规律
    //             let pad = code.length;
    //             let imageUrl = []
    //             // 拿到所有图片路径
    //             for (let i = code - 1; i <= total * 1; i++) {
    //                 imageUrl.push(`https://mh1.wan1979.com/upload/yirenzhixia/${realPage}/${String(i).padStart(pad, 0)}.jpg`)
    //             }
    //             imageList.push({
    //                 chapter: list.chapter,
    //                 imageUrl
    //             })
    //             callback(null, imageList)
    //         })

    //     })
    // }, (err, result) => {
    //     if (err) console.err(err);
    //     console.log(result)
    // })

})