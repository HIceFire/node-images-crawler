const http = require("http")
const fs = require("fs")
const cheerio = require("cheerio")
const iconv = require('iconv-lite')

var domian = 'http://www.3wtu.com'
var config = {
	dirPath: __dirname + '/' + 'imagesByNormal/',
	interval: 300,
}

// 判断存储目录是否存在，不存在就mkdir
if ( !isExit(config.dirPath) ) {
	fs.mkdirSync(config.dirPath)
}

// 网页url形式：http://www.3wtu.com/picture/10.html
for (var i = 10; i < 183; i++) {
	(function (index) {
		var interval = (index - 10) * config.interval + Math.random() * 100
		var url = 'http://www.3wtu.com/picture/' + index + '.html'
		setTimeout(function () { getPicsUrl(url) }, interval)
	})(i)
}

// 获取图片的链接与名字
function getPicsUrl(url) {

	http.get(url, function(res) {
		var chunks = []

		res.on("data" ,function(chunk) {
			chunks.push(chunk)
		})

		// 因为编码问题，不可以用 chunks += chunk。详见https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding

		res.on("end",function() {
			// 转编码后的html
			var decodedBody = iconv.decode(Buffer.concat(chunks), 'gb2312')

			// 服务端版本的JQuery
			var $ = cheerio.load(decodedBody, { decodeEntities: false })

			// 图片的绝对地址
			var pic = domian + $('.detailed-pic img').attr('src')

			// 图片名字
			var name = $('.detailed-title h4').html()

			download({ url: pic, name: name })
		})

	})
	.on('error', function (e) {
		console.log('请求失败：')
		console.log(e)
	})
}

// 下载图片至本地
function download(pic) {

	// 文件类型后缀名
	var fileType = pic.url.split('.').pop()

	// 命名时带上3位时间戳，降低重名的概率
	var diff = new Date().getTime().toString().substring(10)

	// 图片路径与名字
	var name = config.dirPath + pic.name + '#' + diff + '.' + fileType

	// 请求图片数据
	http.get(pic.url, function(res) {
		var data = ''
		res.setEncoding('binary')

		res.on('data', function(chunk) {
				data += chunk
		})

		res.on('end', function() {
			// 保存至本地
			fs.writeFile(name, data, 'binary', function(err) {
				if (err) {
					return console.log(err)
				} else {
					console.log(name + ' downloaded successfully')
				}
			})
		})

	})
	.on('error', function(err) {
			console.log(err)
	})
}

// 判断 文件/目录 是否存在 （ 同步的 ）
function isExit(path) {
	try{
		fs.accessSync(path)
	}catch(e){
		return false
	}
	return true
}
