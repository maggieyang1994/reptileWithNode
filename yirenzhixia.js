const axios = require("axios");
const cheerio = require("cheerio");
const async = require("async");
const path = require("path");
const mysql = require("promise-mysql");
const fs = require("fs")
let pool = mysql.createPool({
    host: '193.112.111.124',
    user: "dev",
    password: "pwd",
    database: "yirenzhixia"
})
let logUrlTxt = ''
let logTxt = ''
const log = (txt, str) => {
    txt += str + "\n";
    console.log(str)
}
// 拿到列表页面

let getList = () => {
    let lists = [];
    return new Promise((resolve, reject) => {
        axios.get("https://www.tohomh123.com/yirenzhixia/").then((res) => {
            let $ = cheerio.load(res.data);
            let list = $(".view-win-list li");
            Array.from(list).forEach((x, index) => {
                let chapter = $(x).find("a").text();
                let link = $(x).find("a").attr("href");
                let total = chapter.match(/\d+(?=P)/)[0]
                if (!(lists.length && lists.map(x => x.link).includes(link))) lists.push({ chapter, link, total })

            })
            lists = lists.reverse();
            lists.forEach((x, index) => x.chapterId = index + 1)
            resolve(lists)
        }).catch(e => reject(e))
    })

}

getList().then(data => {
    let failList = []
    Promise.all(data.map((x, index) => {
        1
    })).then(res => {
        // 插入成功之后
        console.log(failList, logTxt);
        let failUrl = []
        if (!failList.length) {
            log(logTxt, `插入 directory 完毕`)
            fs.writeFile(path.resolve("reptileWithNode/log/insertDic.txt"), logTxt, "utf-8", (err, res) => {
                if (err) console.log(err);
                console.log("文件已经被保存")
            })
            // 再通过列表去详情页 拿图片链接
            async.mapLimit(data, 3, (cur, callback) => {
                let realPage = cur.link.match(/\d+(?=\.html)/);
                realPage = realPage && realPage[0]
                axios.get(`https://www.tohomh123.com/action/play/read?did=7155&sid=${realPage}&iid=2&tmp=0.4808924975193507`).then(code => {
                    console.log(code);
                    if (code.status !== 200) failUrl.push(cur)
                    code = code.data.Code.match(/\d+(?=\.jpg)/)[0];
                    let pad = code.length;
                    let ImageList = []
                    for (let i = code - 1;  i <= cur.total * 1; i++) {
                        ImageList.push({
                            ...cur,
                            imageUrl: `https://mh1.wan1979.com/upload/yirenzhixia/${realPage}/${String(i).padStart(pad, 0)}.jpg`
                        })
                    }
                    console.log(ImageList)
                    callback(null, ImageList)
                }).catch(e=> console.log(e))
            }, (err, result) => {
                if (err) console.log(err);
                console.log(failUrl);
                if (!failUrl.length) {
                    let failImageList = []
                    result = result.reduce((o, item) => o.concat(item),[])
                    Promise.all(result.map(x => {
                        let sqlStr = `insert into yirenzhixia.ImageList(chapterId, ImageUrl) values(${x.chapterId},'${x.imageUrl})`
                        return pool.query(sqlStr).then(res => {
                            if (res.serverStatus === 2) log(logUrlTxt, `insert sucess: ${x.chapterId} - ${x.imageUrl}`)
                            else {log(logUrlTxt, `insert fail: ${x.chapterId} - ${x.imageUrl}`); failImageList.push(x)}
                            return {...x, res}
                        })
                    })).then(res => {
                        console.log(res, logUrlTxt)
                    })
                }
            })
        }
    }).catch(e => console.log(e));
    // 只要有一个fail 全部停止

})



let lists = []

// axios.get("https://www.tohomh123.com/yirenzhixia/").then((res) => {
//     let $ = cheerio.load(res.data);
//     let list = $(".view-win-list li");
//     Array.from(list).reverse().forEach((x, index) => {
//         let chapter = $(x).find("a").text();
//         let link = $(x).find("a").attr("href");
//         if (!(lists.length && lists.map(x => x.link).includes(link))) {
//             lists.push({ chapter, link })
//             let sqlStr = `insert into yirenzhixia.directory(id, chapter) values(${index + 1}, '${chapter}')`
//             // 有插入失败的情况
//             pool.query(sqlStr).then(res => {
//                 console.log(`insert ${res.serverStatus === 2 ? 'success' : 'error'}: ${index + 1}-${chapter}`)
//             })
//         }
//     })
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

// })