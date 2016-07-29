var parser = require('feed-read');
var d3 = require('d3-queue');
var q = d3.queue();
var team = require('mapbox-data-team').getUsernames();
var allEntries = [];
var moment = require('moment');
moment().format();

team.forEach(function (name) {
  q.defer(fetchEntries, name);
});

function fetchEntries(username, callback) {
    var url = "http://www.openstreetmap.org/user/" + username + "/diary/rss";
    parser.get(url, function(err, entries) {
        // do something with entries  
        // push it to a global entries array
        Array.prototype.push.apply(allEntries, entries);
        // allEntries.push(entries);
        callback(null);
    });
}
q.awaitAll(function(error) {
  if (error) throw error;
	allEntries.sort(compare);
	console.log('allEntries', allEntries);
});

function compare(a, b) {
  if (moment(a.published).isBefore(b.published)) {
    return 1;
  } else {
  	return -1;
  }
}






