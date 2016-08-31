var Twit = require('twit');

var Bot = module.exports = function(config) {
  this.twit = new Twit(config);
};

Bot.prototype.tweet = function (status, callback) {
    if(status.length > 140) {
        var newStatus = status.substring(0, 140);
        this.twit.post('statuses/update', {status: newStatus}, callback);
    } else {
        this.twit.post('statuses/update', {status: status}, callback);
    }
};


Bot.prototype.like = function(id, callback) {
    this.twit.post('favorites/create', {id: id}, callback);
};
