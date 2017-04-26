
const http = require("http")
const cheerio = require("cheerio")

var baseURL = `http://www.360doc.com/content/13/0905/08/11561215_312316659.shtml`
var imagesUrlArr = []

getImagesUrl(baseURL)

function getImagesUrl(url) {
	console.log(`开始向${url}发起请求....`)
	http.get(url, function(res) {
		var html = ''

		res.on("data" ,function(data) {
			html += data
		})

		res.on("end",function() {
			var $ = cheerio.load(html)
			var $IMGList = $('#artContent img')

      $IMGList.each(function(index) {
        var imgUrl = $(this).attr('src')
        console.log(imgUrl)
        imagesUrlArr.push(imgUrl)
      })

      console.log(`一共获取到${imagesUrlArr.length}张图片链接`)

		})
	})
	.on('error', function (e) {
		console.log('请求失败：')
		console.log(e)
	})
}
