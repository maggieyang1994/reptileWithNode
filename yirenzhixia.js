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
const logTxt = (list, txt) => {
    list += txt;
    console.log(txt)
}
const getList = () => {
    return new Promise((resolve, reject) => {
        // axios.get(listUrl).then(res => {
            let $ = cheerio.load(res.data);
            let li = Array.from($("#chapterlistload #detail-list-select-1 li")).reverse().slice(0, 3)
            return li.map((x, index) => {
                let chapter = $(x).text().replace(/[\r\n]/g, "").trim();
                let totalP = chapter.match(/\d+(?=P)/g)[0];
                let href = $(x).find("a").attr("href")
                return {
                    index: index + 1,
                    chapter,
                    totalP,
                    href
                }
            })
        }).catch(e => reject(e))
    // })

}
const insertList = async (list, insertFailList = []) => {
    await Promise.all(list.map(x => {
        let sqlStr = `insert into yirenzhixia.directory1(chapterId, chapter) values(${x.index}, '${x.chapter}')`;
        return pool.query(sqlStr).then(res => {
            if (res.serverStatus === 2) logTxt(listTxt, `insert sucess:${x.index}-${x.chapter}`)
            else { insertFailList.push(x); logTxt(listTxt, `insert Fail:${x.index}-${x.chapter}`) }
        })
    }))
    if (insertFailList.length) await insertList(insertFailList);
    else return;
}


// 处理图片
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
                    temp.push({ chapterId: cur.index, imageUrl: `https://mh1.wan1979.com/upload/yirenzhixia/${realPage}/${String(i).padStart(pad, 0)}.jpg` })
                }
                callback(null, temp)
            }).catch(e => console.log(e))
        }, (err, result) => {
            if (err) reject(err)
            resolve(result.reduce((o, item) => o.concat(item)))
        })
    })

}

// 存储图片
const insertImage = async(list, insertFailList = []) => {
    await Promise.all(list.map(x => {
        let sqlStr = `insert into yirenzhixia.ImageList1(chapterId, ImageUrl) values(${x.chapterId}, '${x.imageUrl}')`;
        return pool.query(sqlStr).then(res => {
            if (res.serverStatus === 2) logTxt(imageTxt, `insert sucess:${x.chapterId}-${x.imageUrl}`)
            else { insertFailList.push(x); logTxt(imageTxt, `insert Fail:${x.chapterId}-${x.imageUrl}`) }
        })
    }))
    if (insertFailList.length) insertList(insertFailList);
    else return;

}
const writeFile = (file, txt) => {
    fs.writeFile(file, txt, "utf-8", (err, res) => {
        if (err) console.log(err);
        console.log(`${file}: 文件已经被保存`)
    })
}
const run = async () => {
    let list = await getList();
    insertList(list).then(() => {
        logTxt(listTxt,`插入directory完毕`)
        writeFile(path.resolve("insertDic.txt"), imageTxt)
    })
    let imageList = await getImageList(list);
    insertImage(imageList).then(() => {
        logTxt(imageTxt,`插入imageList完毕`); 
        writeFile(path.resolve("insertiImage.txt"), imageTxt)
    })
}

run()
