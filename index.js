const http = require("http")
const cheerio = require("cheerio")

var imagesUrlArr = []

for (var i = 10; i < 183; i++) {
	getImagesUrl(`http://www.3wtu.com/picture/${i}.html`, i)
}


function getImagesUrl(url, index) {
	console.log(`开始向${url}发起请求....`)
	http.get(url, function(res) {
		var html = ''

		res.on("data" ,function(data) {
			html += data
		})

		res.on("end",function() {
			var $ = cheerio.load(html)
			var img = $('.detailed-pic img').attr('src')
			var name = $('.detailed-title h4').html()
			imagesUrlArr.push({ url: img, name: name })
			console.log({ url: img, name: name })
		})
	})
	.on('error', function (e) {
		console.log('请求失败：')
		console.log(e)
	})
}
