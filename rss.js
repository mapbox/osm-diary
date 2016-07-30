var _ = require('lodash');
var request = require('superagent');
var team = require('mapbox-data-team').getUsernames();
var d3 = require('d3-queue');
var moment = require('moment');
var he = require('he');
var parser = require("rss-parser");
var baseUrl = "http://openstreetmap.org/user/";
var teamEntries = [];

var meta = '<div class="clearfix quiet small"><a class="icon account" href="http://www.openstreetmap/user/<%- entry.user %>"><%- entry.author %></a> | <span class="icon time" href=""><%- entry.time %></span></div>';

var title = '<div class="clearfix box round pad2"><div class="clearfix col12"><h2 class="inline fl"><a href="<%- entry.link %>"><%= entry.title %></a></h2></div>'+meta+'</div>';

var content = _.template('<% _.forEach(entries, function(entry) { %>'+ title + '<% }); %>');
var feed = document.getElementsByClassName('feed');

function fetchEntries(username, callback) {
    var url = baseUrl + username + "/diary/rss";
    console.log(url);
    // callback();
    parser.parseURL(url, function(err, feed) {
        console.log(feed);
        Array.prototype.push.apply(teamEntries, feed.entries);
        callback(null);
    });
    // request.get('https://rss2json.com/api.json?rss_url='+url)
    // .end(function (error, response) {
    //     var items = JSON.parse(response.text).items;
    //     Array.prototype.push.apply(teamEntries, items);
    //     callback(null);
    // });
}

var q = d3.queue();
team.forEach(function (person) {
    q.defer(fetchEntries, person);
});

q.awaitAll(function(error) {
  if (error) throw error;
  var sortedEntries = teamEntries.sort(sort);
  feed[0].innerHTML = content({'entries': sortedEntries});
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