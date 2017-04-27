const http = require("http")
const fs = require("fs")
const cheerio = require("cheerio")
const iconv = require('iconv-lite')


var doMian = `http://www.3wtu.com`
var storagePath = `./kekeke/`

for (var i = 10; i < 183; i++) {
	start(i)
}

function start (i) {

	// 每 500ms ~ 600ms 请求一次
	setTimeout(function () {
		getImagesUrl('http://www.3wtu.com/picture/' + i + '.html')
	}, (i - 10) * 500 + Math.random() * 100)
}

function getImagesUrl(url) {
	console.log('开始向'+ url + '发起请求。。。')

	http.get(url, function(res) {
		var chunks = []

		res.on("data" ,function(chunk) {
			chunks.push(chunk)
		})

		// 因为编码问题，不可以用 chunks += chunk，详见https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding

		res.on("end",function() {
			// decodedBody转编码后的html
			var decodedBody = iconv.decode(Buffer.concat(chunks), 'gb2312')

			// 功能如JQuery
			var $ = cheerio.load(decodedBody, { decodeEntities: false })

			// 取图片的绝对地址
			var img = doMian + $('.detailed-pic img').attr('src')

			// 取图片名字
			var name = $('.detailed-title h4').html()

			// 下载图片至本地
			downloadImage({ url: img, name: name })

		})

	})
	.on('error', function (e) {
		console.log('请求失败：')
		console.log(e)
	})
}


function downloadImage(info) {
	// 文件类型后缀名
	var fileType = info.url.split('.').pop()

	// 防止文字重名，带上3位时间戳
	var diff = new Date().getTime().toString().substring(10)

	// 文件名字
	var name = storagePath + info.name + '#' + diff + '.' + fileType

	// 请求图片数据
	http.get(info.url, function(res) {
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
