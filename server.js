//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');
var express = require("express");
var http = require("http");
var checkUrl=require("./validUrl");
var app = express();

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.

//(Focus on This Variable)

var json_res={};
app.get("/", function(request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.write("Use /new/url to get the tinyurl of a site\n");
    response.end("Or enter  the tinyurl of a site");
});
app.get("/new/*", function(request, response,next) {
      response.writeHead(200, { "Content-Type": "text/plain" });

    var url=request.params[0];
    if(checkUrl(url)){
        json_res={
            "url":url,
        }

        var mongo_url = process.env.MONGOLAB_URI;      
        //(Focus on This Variable)

        // Use connect method to connect to the Server
        MongoClient.connect(mongo_url, function (err, db) {
            if (err) {
                console.log('Unable to connect to the mongoDB server. Error:', err);
            }
            else {
                console.log('Connection established to', mongo_url);
                var collection = db.collection('urls')
                collection.find().limit(1).sort({$natural:-1}).toArray(function(err,doc){
                    if(doc.length===0)
                        json_res.id=0;
                    else 
                        json_res.id=doc[0].id+1;
                     collection.insert(json_res, function(err,s) {
                         json_res.tiny_url=(request.protocol + '://' + request.get('host') + request.url).replace("new/"+request.params[0],"")+json_res.id;
                        var str=JSON.stringify(json_res);
                        response.end(str);
                        db.close();
                     });
                });
            }
        });
    }
    else{
         json_res={
            "url":"wrong url"
         }
        var str=JSON.stringify(json_res);
        response.end(str);

    }
    
});
app.get("/:number", function(request, response,next) {

    
    var mongo_url = process.env.MONGOLAB_URI;      
    //(Focus on This Variable)

    // Use connect method to connect to the Server
    MongoClient.connect(mongo_url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        }
        else {
            console.log('Connection established to', mongo_url);
            var collection = db.collection('urls')
            collection.find({"id":parseInt(request.params.number)}).limit(1).toArray(function(err,doc){
                if(doc.length===0){
                    json_res={"result":"no url to redirect"};
                    response.end(JSON.stringify(json_res));
                }
                else {
                    response.setHeader("Location", doc[0].url);
                    response.writeHead(302);
                    response.end();
                }
                db.close();
            });
        }
    });    
    
});
app.get("*", function(request, response) {
    response.end("404!");
});
http.createServer(app);
var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});