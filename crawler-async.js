const http = require('http')
const cheerio = require('cheerio')
const fs = require('fs')
const url = require('url')

const domain = 'http://www.360doc.com/content/13/0905/08/11561215_312316659.shtml'
const config = {
	dirPath: `${__dirname}/imagesByAsync/`,
	interval: 300,
}

crawler()

// 这么写代码是不是舒服多了
async function crawler() {
	if ( !isExit(config.dirPath) ) {
		fs.mkdirSync(config.dirPath)
	}

	var picsArr = await getPicsUrl(domain)

	for (let i = 0; i < picsArr.length; i++) {
		await _setTimeout()
		var pic = await getPicData(picsArr[i])
		var resJson = await download(pic)
		console.log(resJson.err || `${resJson.name} downloaded successfully`)
	}

}

// 这儿固定时间间隔，与promise.js和normal.js的渐进时间间隔不同
function _setTimeout() {
	var interval = config.interval + Math.random() * 100
	return new Promise(resolve => {
		setTimeout(() => {
			resolve()
		}, interval)
	})
}

function getPicsUrl(url) {
	console.log(`开始向${url}请求图片地址...`)
	var html = ''
	return new Promise(resolve => {
		http.get(url, res => {
			res.on('data', data => { html += data })
			res.on('end', data => {
				var $ = cheerio.load(html)
				var $pics = $('#artContent img')
				var pics = [].slice.call($pics).map(pic => {
					return pic.attribs.src
				})

				console.log(`图片链接获取完毕，共${pics.length}张图片。`)
				resolve(pics)
			})
		})
	})
}

function getPicData(urlStr) {
	var name = urlStr.substring(56)
	var urlJson = url.parse(urlStr)
	var data = ''

	var option = {
		hostname: urlJson.hostname,
		path: urlJson.pathname,
		// 对方网站有限制爬虫，需要设置header假装浏览器
		headers: {
			"User-Agent": `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36`,
			"Referer":	`http://www.360doc.com/content/13/0905/08/11561215_312316659.shtml`,
		}
	}

	return new Promise(resolve => {
		http.get(option, res => {
			res.setEncoding('binary')
			res.on('data', chunk => { data += chunk })
			res.on('end', () => {
				resolve({name, data})
			})
		})
	})
}

function download(pic) {
	return new Promise(resolve => {
		fs.writeFile(config.dirPath + pic.name, pic.data, 'binary', err => {
			resolve({ err: err, name: pic.name })
		})
	})
}

function isExit(path) {
	try{
		fs.accessSync(path)
	}catch(e){
		return false
	}
	return true
}
