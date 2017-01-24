var _ = require('lodash');
var mdt = require('mapbox-data-team');
var team = mdt.getUsernames();
var d3 = require('d3-queue');
var moment = require('moment');
var he = require('he');
var parser = require("rss-parser");
var baseUrl = "https://www.openstreetmap.org/user/";
var teamEntries = [];
var AWS = require("aws-sdk");

var meta = '<div class="clearfix quiet small"><a class="icon account" href="http://www.openstreetmap/user/<%- entry.user %>"><%- entry.user %></a> | <span class="icon time" href=""><%- entry.time %></span></div>';

var title = '<div class="clearfix box round pad2"><div class="clearfix col12"><h2 class="inline fl"><a href="<%- entry.link %>"><%= entry.title %></a></h2></div>'+meta+'</div>';

var content = _.template('<% _.forEach(entries, function(entry) { %>'+ title + '<% }); %>');
var feed = document.getElementsByClassName('feed');

AWS.config.update({
    accessKeyId: "AKIAIUKCRM6DC3WI2EUQ",
    secretAccessKey: "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"
});
var lambda = new AWS.Lambda({ region: "us-east-1" });

function fetchEntries(username, callback) {
    var url = baseUrl + username + "/diary/rss";

    lambda.invoke({
        FunctionName: "cors-proxy-osm-diaries",
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({ url: url })
    }, function(error, response) {
        var json = JSON.parse(response.Payload);
        parser.parseString(json.body, function (err, feed) {
            feed.feed.entries.forEach(function (f) {
                f.user = username;
            });
            Array.prototype.push.apply(teamEntries, feed.feed.entries);
            callback(null);
        });
    });
}

var q = d3.queue();
team.forEach(function (person) {
    q.defer(fetchEntries, person);
});

q.awaitAll(function(error) {
  if (error) throw error;
  var sortedEntries = teamEntries.sort(sort);
  feed[0].innerHTML = content({'entries': sortedEntries});
  document.getElementsByClassName('content')[0].className = 'limiter';
});

function sort(a, b) {
    var aDate = moment(a.pubDate);
    var bDate = moment(b.pubDate);

    // this is bad
    a.time = aDate.format('D MMM, YYYY, h:mm a');
    a.title = he.decode(a.title);

    if (aDate.isBefore(b.pubDate)) {
        return 1;
    } else {
        return -1;
    }
}