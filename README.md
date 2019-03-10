# 基于Node.js图片爬虫对比Callback、Promise和Async Function
爱好[三维立体图](http://baike.baidu.com/item/%E4%B8%89%E7%BB%B4%E7%AB%8B%E4%BD%93%E5%9B%BE/3316678?fromtitle=%E4%B8%89%E7%BB%B4%E7%AB%8B%E4%BD%93%E7%94%BB&fromid=569577)多年，近期打算将网络上能找到的资源收集一下。本着“偷懒至上”的原则，写一简单爬虫脚本解放手指。作为前端狗，不忘本职工作，分别用`Callback`，`Promise`和`Async`实现一遍，权当学习ES6/7了。
<!-- more -->

## Callback形式
- 目标网站：http://www.3wtu.com/
- 流程简述：
图片url分别存储在`http://www.3wtu.com/picture/${i}.html (9 < i <183)`这些网页。首先遍历这些网址，分别执行**获取图片url => 获取图片数据 => 保存至本地。**
- 不相关技术点：编码转换。


---
### 1. 取图片链接
首先我们封装一个单次请求的方法。由于我们的目标网站使用的`gb2312`的编码，因此我引入iconv模块用来解码。**注意，不可用`chunk += chunk` 取代`chunks.push(chunk)`，前者隐含了操作`chunk += chunk.toString('utf8')`。** 详见[github.com/ashtuchkin/iconv-lite](https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding)。
了解Nodejs的朋友应该对cheerio模块不会陌生，它相当于一个服务端的JQuery。

```js
const http = require("http")
const fs = require("fs")
const cheerio = require("cheerio")
const iconv = require('iconv-lite')

var domian = 'http://www.3wtu.com'
var config = {
  dirPath: __dirname + '/' + 'imagesByNormal/',  // 图片存储目录
  interval: 300,  // 单次请求的时间间隔
}

function getPicsUrl(url, callback) {
  http.get(url, function(res) {
    var chunks = []

    res.on("data" ,function(chunk) {
      chunks.push(chunk)
    })

    res.on("end",function() {
      // 转编码后的html
      var decodedBody = iconv.decode(Buffer.concat(chunks), 'gb2312')

      // 服务端版本的JQuery
      var $ = cheerio.load(decodedBody, { decodeEntities: false })

      // 图片的绝对地址
      var pic = domian + $('.detailed-pic img').attr('src')

      // 图片名字
      var name = $('.detailed-title h4').html()

      callback({ url: pic, name: name })
    })

  })
}
```

### 2. 请求图片数据
拿到图片的链接之后，我们就需要请求图片的数据。
```js
function getPicData(pic, callback) {

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
      callback(data, name)
    })
  })
}

```

### 3. File System 下载图片至本地
最后把图片存储到我们的本地。

```js
function download(data, name, callback) {
  fs.writeFile(name, data, 'binary', callback)
}
```

### 4.启动
以上三步就是针对目标网站将一张图片爬下来的全部过程。
现在我们只要启动遍历所有的目标网站即可
```js
for (var i = 10; i < 183; i++) {
  (function (index) {
    var interval = (index - 10) * config.interval + Math.random() * 100
    var url = 'http://www.3wtu.com/picture/' + index + '.html'

    setTimeout(function () {  // 等待，防止请求太快
      getPicsUrl(url, function(picLink) {  // 网页 => 图片url
        getPicData(picLink, function (picData) {  // 图片url => 图片数据
          download(picData.data, picData.name, function (err) {  // 图片数据 => 本地图片
            if (err) {
              console.log(err)
            } else {
              console.log(picData.name + ' downloaded successfully')
            }
          })
        })
      })
    }, interval)
  })(i)
}

```
以上代码重点看`setTimeout`，`getPicsUrl `，`getPicData`，`download`四连回调。这样写代码是不是特别地不舒服呢？如果再多几个嵌套回调，代码的可读性就会非常差。感受到了痛点，才能更好的理解“我们需要一些新东西取解决痛点”。而新东西就是指`Promise`和`Async`。

## Promise与Async Function
本文主要目的在于结合实例阐述`Promise`和`Async Function`对开发效率及体验的友好度。如果一点都不了解`Promise`的朋友，可以先看看阮一峰老师的[ES6标准入门](http://es6.ruanyifeng.com/#docs/promise)。
另外，这里将`Promise`和`Async`放在一起，就是希望大家不要把两者对立起来。`Promise`本身是用于封装异步操作，同时提供了**流程控制**的API。而`Async Function` 函数只是对异步操作的**流程控制**，比`Promise`更加的直观和简洁，进一步提高了代码可读性。如果读到这句话一点概念也没有，可以先戳这里[Generator](http://es6.ruanyifeng.com/#docs/generator)，都说`Async Function`是`Generator`的语法糖，学习`Async Function`之前还是需要对`Generator`有一定了解的。（其实我觉得语法糖这个说法不太好，`Class`那种东西才是纯粹的语法糖好么？）

---
- 目标网站：http://www.360doc.com/content/13/0905/08/11561215_312316659.shtml
- 流程简述：
首先从目标网站中获取所有的图片url，遍历url数组 => 获取图片数据 => 保存至本地 。
- 不相关技术点：设置Request Header模拟浏览器行为。
---
### 1. 将异步函数封装成Promise
首先我们需要把上述的异步函数封装成`Promise`。

- 定时器
```js
function _setTimeout(i) {
  var interval = i * config.interval + Math.random() * 100
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, interval)
  })
}
```
- 获取图片url数组
```js
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
```
- 获取图片数据
以下这段代码运用到了设置header模拟浏览器，我对这方面并无过多的了解，仅仅是针对需求而解决问题一种方案。就不过多解释了。（基础的http知识是必须具备的，只是应用层面上各取所需就好，学习是需要成本的，应该珍惜时间才对）
```js
function getPicData(urlStr) {
  var name = urlStr.substring(56)
  var urlJson = url.parse(urlStr)
  var data = ''

  var option = {
    hostname: urlJson.hostname,
    path: urlJson.pathname,
    // 对方网站有限制爬虫，需要设置header模拟浏览器
    headers: {
      "User-Agent": `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36`,
      "Referer":  `http://www.360doc.com/content/13/0905/08/11561215_312316659.shtml`,
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
```
- 下载图片至本地
```js
function download(pic) {
  return new Promise(resolve => {
    fs.writeFile(config.dirPath + pic.name, pic.data, 'binary', err => {
      resolve({ err: err, name: pic.name })
    })
  })
}
```


### 2. Promise的流程控制
是不是很熟悉JQuery `return this`的链式操作？`Promise`的流程控制就特别相似，这样写代码是不是比嵌套回调舒服很多吧？
```js
getPicsUrl(domain).then(picsArr => {  // 获取图片url数组
  for (let i = 0; i < picsArr.length; i++) {
    _setTimeout(i)  // 定时器等待
    .then(() => getPicData(picsArr[i]))  // 获取图片数据
    .then(pic => download(pic))  // 下载图片至本地
    .then(resJson => {
      console.log(resJson.err || `${resJson.name} downloaded successfully`)
    })
  }
})
```
### 3. Async的流程控制
是不是已经非常接近同步代码了？毕竟号称异步编程之终极方案的~
```js
async function crawler() {
  if ( !isExit(config.dirPath) ) {
    fs.mkdirSync(config.dirPath)
  }
  var picsArr = await getPicsUrl(domain)  // 获取图片url数组
  for (let i = 0; i < picsArr.length; i++) {
    await _setTimeout()  // 定时器等待
    var pic = await getPicData(picsArr[i])  // 获取图片数据
    var resJson = await download(pic)  // 下载图片至本地
    console.log(resJson.err || `${resJson.name} downloaded successfully`)
  }
}
```

## 作品展示
[源码戳我](https://github.com/vq0599/node-images-crawler)
展示一下成果，一共330张三维立体图

![www.3wtu.com](https://static.vq0599.com/images/Yz4TWwvh_.png)
<br>
![www.360doc.com](https://static.vq0599.com/images/2QUGCfhHX.png)
<br>
如果看到这里你对三维立体图感兴趣，可以试试看破解下面这张。
<br>
![雪人.jpg](https://static.vq0599.com/images/gl2qPmvrz.jpg)
