const cheerio = require("cheerio");
const http = require("http");
const request = require("request")
let url = 'https://www.jianshu.com/c/NEt52a?order_by=top&page=';
let domin = "https://www.jianshu.com"
const getList = (i) => {
    return new Promise((resolve, reject) => {
        request(url + i, (err, response, body) => {
            if (err) reject(err)
            resolve({
                statusCode: response.statusCode,
                content: body
            })
        })
    })
}
let times = 0
// let promise = Promise.all([getList(1),getList(2),getList(3),getList(4)]).then(data => {
//     console.log(data)
// })
const f1 = () => {
    console.time("begin")
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
            console.timeEnd("begin")
            // console.log(results)
        })
}

f1();
const f2 = () => {
    let res = [];
    console.time("end")
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
            console.timeEnd("end")
        })
    })

}
f2();

