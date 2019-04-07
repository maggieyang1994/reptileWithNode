const axios = require("axios");
const cheerio = require('cheerio');
const async = require("async");
const fs = require('fs')
const mkdirp = require('mkdirp')
const request = require('request')
const mysql = require("promise-mysql");

let pool = mysql.createPool({
    host: '193.112.111.124',
    user: "dev",
    password: "pwd",
    database: "yirenzhixia"
})


const getChaptersList = url => {
    return axios.get(url)
        .then(res => {
            const $ = cheerio.load(res.data)
            const elList = Array.from($("#detail-list-select-1 li a"))

            return elList
                .map(item => {
                    const el = $(item)
                    const path = el.attr('href')
                    const name = el.text()

                    let sid = +path.match(/([\d]+)\.html/)[1]
                    let imgCount = +name.match(/（([\d]+)P）/)[1]

                    return {path, name, sid, imgCount}
                })
                .sort((x, y) => x.sid - y.sid)
                // .slice(0, 5)
        })
        .catch(e => {
            console.error('获取章节列表失败。')
        })
}

const getFirstImg = chapterList => new Promise((resolve, reject) => {
    async.mapLimit(
        chapterList,
        20,
        (item, cb) => {
            const url = `https://www.tohomh123.com/action/play/read?did=7155&sid=${item.sid}&iid=1`
            console.log(`获取 ${item.name} 首张图片地址: ${url} ...`)

            axios.get(url)
                .then(res => {
                    const firstImgPath = res.data.Code
                    cb(null, { ...item, firstImgPath })
                })
                .catch(e => {
                    console.err('获取首张图片失败。')
                    cb(e, null)
                })
        },
        (err, result) => {
            console.log(`获取所有数据完毕。`)
            resolve(result)
        }
    )
})

const computeAllImg = chapterList => chapterList.map(chapter => {
    // {path, name, sid, imgCount, firstImgPath, imgList}

    const firstImgPath = chapter.firstImgPath
    const firstImgName = firstImgPath.match(/([\d]+).jpg/)[1]
    const namgLen = firstImgName.length
    const start = +firstImgName
    let imgCount = +chapter.name.match(/（([\d]+)P）/)[1]

    const imgList = Array.from({ length: imgCount }, (v, i) => {
        const imagUrl = `https://mh1.wan1979.com/upload/yirenzhixia/${chapter.sid}/${(start + i + '').padStart(namgLen, '0')}.jpg`
        return imagUrl
    })

    return {
        ...chapter,
        imgList
    }
})

const run = async () => {
    console.log('开始获取章节数据 ...')
    const listUrl = 'https://www.tohomh123.com/yirenzhixia/'
    let chapterList = await getChaptersList(listUrl)

    // ....

    console.log(`获取到章节列表，共 ${chapterList.length} 条记录：`, chapterList)
    chapterList = await getFirstImg(chapterList)

    chapterList = computeAllImg(chapterList)
}

run()