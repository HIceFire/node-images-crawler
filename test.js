var http = require("http");
var fs = require("fs");



// var url = "http://s0.hao123img.com/res/img/logo/logonew.png"
var url = 'http://image.360doc.com/DownloadImg/2008/7/31/60756_1494643_2.jpg'

http.get(url, function(res){
    var imgData = "";

    res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开


    res.on("data", function(chunk){
        imgData+=chunk;
    });

    res.on("end", function(){
        fs.writeFile("./images/logonew.jpg", imgData, "binary", function(err){
            if(err){
                console.log("down fail");
								console.log(err);
            }
            console.log("down success");
        });
    });
});
