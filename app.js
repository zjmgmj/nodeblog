var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var http = require('http').Server(express);
//var io = require('socket.io')(http);

var routes = require('./routes/index');
var settings = require('./settings');
var flash = require('connect-flash');
var users = require('./models/user.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

app.use(session({
secret: settings.cookieSecret,
key: settings.db,//cookie name
cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
url: settings.url
//store: new MongoStore({
//  db: settings.db,
//  host: settings.host,
//  port: settings.port
//})
}));
//app.use(session({
//	secret: settings.cookieSecret,
//	cookie: {
//		maxAge: 1000 * 60 * 60 * 24 * 30
//	}, //30 days
//	url: settings.url
//}));
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use(flash());
app.use('/', routes);
app.use('/users', users);
app.use(bodyParser.json());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if(app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;