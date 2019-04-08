const cheerio = require("cheerio");
const async = require("async");
const mysql = require("promise-mysql")
const axios = require("axios");
const listUrl = "https://www.tohomh123.com/yirenzhixia/"
const fs = require("fs");
const path = require("path")
let pool = mysql.createPool({
    host: '',
    user: "dev",
    password: "pwd",
    database: "yirenzhixia"
})
let listTxt = ''
let imageTxt = ''
const logListTxt = (txt) => {
    listTxt += txt + "\n"
    console.log(txt)
}
const logImageTxt = (txt) => {
    imageTxt += txt + "\n"
    console.log(txt)
}
const writeFile = (file, txt) => {
    fs.writeFile(file, txt, "utf-8", (err, res) => {
        if (err) console.log(err);
        console.log(`${file}: 文件已经被保存`)
    })
}
const getList = () => {
    // axios.get 返回的本来就是promise  这里不用new Promise
    // return new Promise((resolve, reject) => {
    return axios.get(listUrl).then(res => {
        let $ = cheerio.load(res.data);
        let li = Array.from($("#chapterlistload #detail-list-select-1 li")).reverse().slice(0, 3)
        return li.map((x, index) => {
            let chapter = $(x).text().replace(/[\r\n]/g, "").trim();
            let totalP = chapter.match(/\d+(?=P)/g)[0];
            let href = $(x).find("a").attr("href")
            return {
                chapterId: index + 1,
                chapter,
                totalP,
                href
            }
        })
    }).catch(e => Promise.reject(e))
    // })

}

// 拿到图片
const getImageList = (list) => {
    return new Promise((resolve, reject) => {
        async.mapLimit(list, 5, (cur, callback) => {
            let temp = []
            let realPage = cur.href.match(/\d+(?=\.html)/g)[0]
            axios.get(`https://www.tohomh123.com/action/play/read?did=7155&sid=${realPage}&iid=1`).then(res => {
                let code = res.data.Code.match(/\d+(?=\.jpg)/g)[0];
                let pad = code.length;
                let len = cur.totalP * 1;
                for (let i = code; i <= len; i++) {
                    temp.push({ chapterId: cur.chapterId, ImageUrl: `https://mh1.wan1979.com/upload/yirenzhixia/${realPage}/${String(i).padStart(pad, 0)}.jpg` })
                }
                callback(null, temp)
            }).catch(e => console.log(e))
        }, (err, result) => {
            if (err) reject(err)
            resolve(result.reduce((o, item) => o.concat(item)))
        })
    })

}

const insertList = async (list,tableName, column1, column2, log,insertFailList = []) => {
    // 万箭齐发版本
    // await Promise.all(list.map(cur => {
    //     let sqlStr = `insert into ${tableName}(column1, column2) values(${cur[column1]}, '${cur[column2]}')`;
    //     return pool.query(sqlStr).then(res => {
    //         if (res.serverStatus === 2) log.call(null,`insert sucess:${cur[column1]}-${cur[column2]}`)
    //     }).catch(e => {
    //         log.call(null,`insert fail:${cur[column1]}-${cur[column2]}- ${e}`);
    //         if(e.code !== 'ER_DUP_ENTRY') insertFailList.push(cur)
    //     })
    // }))
    // if (insertFailList.length) await insertList(insertFailList,tableName, column1, column2);
    // else return



    // 控制并发版本
    return new Promise((resolve, reject) => {
        async.mapLimit(list, 2, (cur, callback) => {
            let sqlStr = `insert into ${tableName}(${column1}, ${column2}) values(${cur[column1]}, '${cur[column2]}')`;
            pool.query(sqlStr).then(res => {
                if (res.serverStatus === 2) { log.call(null, `insert sucess:${cur[column1]}-${cur[column2]}`); callback(null, []) }
            }).catch(e => {
                log.call(null,`insert fail:${cur[column1]}-${cur[column2]}- ${e}`);
                if (e.code !== 'ER_DUP_ENTRY') insertFailList.push(cur);
                callback(null, insertFailList)
            })
        }, async (err, result) => {
            if (err) reject(err);
            result = result.reduce((o, item) => o.concat(item));
            if (result.length) await insertList(result,tableName, column1, column2,log);
            else resolve()
        })
    })

}

const run = async () => {
    let list = await getList();
    insertList(list, "directory1", 'chapterId', "chapter", logListTxt).then(() => {
        logListTxt(`插入directory完毕`)
        writeFile(path.resolve("reptileWithNode/log/insertDic.txt"), listTxt)
    })
    let imageList = await getImageList(list);
    insertList(imageList,"ImageList1", "chapterId", "ImageUrl",logImageTxt).then(() => {
        logImageTxt(`插入imageList完毕`);
        writeFile(path.resolve("reptileWithNode/log/insertiImage.txt"), imageTxt)
    })
}

run()
