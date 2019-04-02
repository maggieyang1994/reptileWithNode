const cheerio = require("cheerio");
const http = require("http");
const async = require("async")
const request = require("request")
let url = 'https://www.jianshu.com/c/NEt52a?order_by=top&page=';
let domin = "https://www.jianshu.com"

const getList = (listUrls, leakUrl) => {
    return new Promise((resolve, reject) => {
        async.mapLimit(listUrls, 2, (url, callback) => {
            request(url, (err, response, body) => {
                // 有遗漏
                !body && leakUrl.push(url)
                let $ = cheerio.load(body);
                let res = []
                Array.from($(".note-list li .title")).forEach(x => {
                    res.push($(x).attr("href"))
                })
                callback(null, res)

            })
        }, (err, result) => {
            if(err) reject(err)
            let res = []
            result.forEach(x => {
                res = res.concat(x)
            })
            res = [...new Set(res)];
            resolve({res, leakUrl})
        })
    })

}


let listUrls = Array.from({ length: 3 }, (x, i) => url + (i + 1));
let leakUrl = []
getList(listUrls,leakUrl).then(res => {
    console.log(res);
    // if(res.leakUrl.length)
})


const f1 = () => {
    console.time("f1")
    new Promise((resolve, reject) => {
        const urls = []
        request('https://www.jianshu.com/c/NEt52a?order_by=top', async (err, respense, body) => {
            if (err) return reject(err)

            let $ = cheerio.load(body);
            let len = $(".note-list li").length;
            for (let index = 0; index < len; index++) {
                let x = $(".note-list li")[index];
                let subUrl = $(x).find("a").attr("href");
                urls.push(subUrl)
            }

            resolve(urls)
        })
    })
        .then(urls => {
            return Promise.all(
                urls.map((x, index) => new Promise((resolve, reject) => {
                    request(domin + x, (err, Response, body) => {
                        if (err) console.log(err)

                        let $1 = cheerio.load(body);
                        let title = $1("h1.title").text();
                        let codeCount = $1(".show-content code").length;

                        resolve({
                            index,
                            title,
                            codeCount
                        })
                    })
                }))
            )
        })
        .then(results => {
            console.timeEnd("f1")
            // console.log(results)
        })
}

// f1();
const f2 = () => {
    let res = [];
    console.time("f2")
    request('https://www.jianshu.com/c/NEt52a?order_by=top', async (err, respense, body) => {
        let $ = cheerio.load(body);
        let len = $(".note-list li").length;

        for (let index = 0; index < len; index++) {
            let x = $(".note-list li")[index];
            let subUrl = $(x).find("a").attr("href");

            let temp = new Promise((resolve, reject) => {
                request(domin + subUrl, (err, Response, body) => {
                    if (err) reject(err)

                    let $1 = cheerio.load(body);
                    let title = $1("h1.title").text();
                    let codeCount = $1(".show-content code").length;
                    resolve({
                        index,
                        title,
                        codeCount
                    })

                })
            })
            res.push(temp)

        }
        Promise.all(res).then(data => {
            // console.log(data);
            console.timeEnd("f2")
        })
    })

}
// f2();

const f3 = () => {
    let subUrl = [];
    console.time("f3")
    new Promise((resolve, reject) => {
        request("https://www.jianshu.com/c/NEt52a?order_by=top", async (err, response, body) => {
            if (err) console.log(err);
            let $ = cheerio.load(body);
            let len = $(".note-list li").length;
            for (let i = 0; i < len; i++) {
                let cur = $(".note-list li")[i]
                subUrl.push($(cur).find("a").attr("href"));
            }
            resolve(subUrl)
        })
    }).then(urls => {
        // 最多有5个请求同时发   一个完成了就会再加一个
        console.time("async")
        async.mapLimit(urls, 5, (url, callback) => {
            // console.log(url)
            request(domin + url, (err, response, body) => {
                callback(null, body)
            })
        }, function (err, result) {
            console.timeEnd("async")
            //    console.log("result", result)
        })
    })
}
// f3();



