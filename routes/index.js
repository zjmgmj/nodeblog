var express = require('express');
var router = express.Router();

var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js'),
	Comment = require('../models/comment.js');
//	app = express.createServer().listen(3000),

var http = require('http').Server(router);
var io = require('socket.io')(http),mongodb = require('mongodb');;

var users = [];//保存在线用户
var socketlist = [];//保存当前建立的所有socket
var socketnum = 0, usernum = 0;
//监听socket连接
io.on('connection', function(socket)
{
	socketlist[socketnum++] = socket;
	console.log('someone connected!');
	socket.send(toUserList(users));
	
	socket.on('message', function(data)
	{
		var result = eval('('+ data +')');
		var username = result.username;
		var content = result.content;
		var wordsize = result.wordsize;
		var wordcolor = result.wordcolor;
		var sendcontent = "<p style='color:black;font-size:15px'>"+username+":<span style='color:"+wordcolor+";font-size:"+wordsize+"px;'>"+content+"</span></P>"
		
		for(var i = 0; i < socketlist.length; ++i)
		{
			if(socketlist[i])
			{
				var jsonstr = '{type:"info",content:"'+sendcontent+'"}';
				console.log(jsonstr);
				socketlist[i].send(jsonstr);
			}
		}
	});
	
});
//express基本配置

router.get('/login', function(req, res)
{
//	res.sendfile('views/login.html', {root:__dirname});
//	console.log('please login first.');
	res.render('login', {
		title: 'socket',
		
	});
});
router.get('/chartroom', function(req, res)
{
//	res.sendfile('views/login.html', {root:__dirname});
//	console.log('please login first.');
	res.render('chartroom', {
		title: 'socket',
		
	});
});
router.post('/login', function(req, res)
{
	var username = req.body.username;
	var password = req.body.password;
	//query the database	
	
	var dbserver = new mongodb.Server('127.0.0.1', 27017);
	new mongodb.Db('myqq', dbserver).open(function(err, client)
	{
		if(err) throw err;
		console.log('connect mongodb success!!!');
		router.user = new mongodb.Collection(client ,'users');
		router.user.findOne({name:req.body.username, password:req.body.password}, function(err, doc)
		{
			if(doc)
			{
				if(isNewer(username))
				{
					users[usernum++] = username;
					console.log(username + " login success!");
				}
				else
				{
					console.log(username + " welcome back!");
				}
				res.setHeader("Set-Cookie", 'username='+username);
				res.sendfile('/chartRoom', {root:__dirname});
			}
			else
			{
				res.sendfile('login', {root:__dirname});
				console.log('login failure!');
			}
		});
		
	});
});
function toUserList(userslist)
{
	var temp, list = '';
	for(var i = 0; i < userslist.length; ++i)
	{
		temp = "<p style='height:15px;color:green;margin:4px'>" + userslist[i] + "</p>";
		list += temp;
	}	
	var jsonstr = '{type:"ulist",content:"'+list+'"}';
	return jsonstr;
}
function isNewer(username)
{
	for(var i = 0; i < users.length; ++i)
	{
		if(username == users[i])
			return false;
	}
	return true;
}


var multer = require('multer');

var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/images')
	},
	filename: function(req, file, cb) {
		cb(null, file.originalname)
	}
});
var upload = multer({
	storage: storage
});
/* GET home page. */
router.get('/socket1', function(req, res) {
	res.render('socket1', {
		title: 'socket',
		
	});
});
router.get('/', checkLogin);
router.get('/', function(req, res) {
	//判断是否是第一页，并把请求的页数转换成 number 类型
	var page = parseInt(req.query.p) || 1;
	//查询并返回第 page 页的 10 篇文章
	Post.getTen(null, page, function(err, posts, total) {
		if(err) {
			posts = [];
		}
		res.render('index', {
			title: '主页',
			posts: posts,
			page: page,
			isFirstPage: (page - 1) == 0,
			isLastPage: ((page - 1) * 10 + posts.length) == total,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

router.get('/detail', function(req, res) {
	Post.getAll(null, function(err, posts) {
		if(err) {
			posts = [];
		}
		res.render('detail', {
			title: '详情',
			user: req.session.user,
			posts: posts,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});
router.get('/reg', function(req, res) {
	res.render('reg', {
		title: '注册',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});
router.post('/reg', function(req, res) {
	var name = req.body.name,
		password = req.body.password,
		password_re = req.body['password-repeat'];
	if(password_re != password) {
		req.flash('error', '两次输入的密码不一致!');
		return res.redirect('/reg');
	}
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');
	var newUser = new User({
		name: name,
		password: password,
		email: req.body.email
	});
	User.get(newUser.name, function(err, user) {
		if(err) {
			req.flash('error', err);
			return res.redirect('/reg');
		}
		if(user) {
			req.flash('error', '用户已存在!');
			return res.redirect('/reg');
		}
		newUser.save(function(err, user) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/reg');
			}
			req.session.user = user;
			req.flash('success', '注册成功!');
			res.redirect('admin/login');
		});
	});
});
//router.get('/login', checkNotLogin);
router.get('/admin/login', function(req, res) {
	res.render('admin/login', {
		title: '登陆',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});
//router.post('/login', checkNotLogin);
router.post('/admin/login', function(req, res) {
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');
	User.get(req.body.name, function(err, user) {
		if(!user) {
			req.flash('error', '用户不存在!');
			return res.redirect('/reg');
		}
		if(user.password != password) {
			req.flash('error', '密码错误!');
			return res.redirect('/admin/login');
		}
		req.session.user = user;
		req.flash('success', '登陆成功!');
		res.redirect('/');
	});
});
router.get('/admin/post', checkLogin);
router.get('/admin/post', function(req, res) {
	res.render('admin/post', {
		title: '发布',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});
router.post('/admin/post', function(req, res) {
	//var currentUser = req.session.user,
	//    post = new Post(currentUser.name, req.body.title, req.body.post);
//	var currentUser = req.session.user,
//		tags = [req.body.tag1, req.body.tag2, req.body.tag3],
//		post = new Post(currentUser.name, req.body.title,req.body.sort, req.body.post, tags);
var currentUser = req.session.user,
    tags = [req.body.tag1, req.body.tag2, req.body.tag3],
    post = new Post(currentUser.name, req.body.title, tags, req.body.post);
	post.save(function(err) {
		if(err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		req.flash('success', '发布成功!');
		res.redirect('/admin/post');
	});
});
//router.get('/logout', checkLogin);
router.get('/admin/logout', function(req, res) {
	req.session.user = null;
	req.flash('success', '登出成功!');
	res.redirect('/admin/login');
});
router.get('/admin/upload', checkLogin);
router.get('/admin/upload', function(req, res) {
	res.render('admin/upload', {
		title: '文件上传',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});
router.post('/admin/upload', checkLogin);
router.post('/admin/upload', upload.array('field1', 5), function(req, res) {
	req.flash('success', '文件上传成功!');
	res.redirect('/admin/post');
});
router.get('/u/:name', function(req, res) {
	var page = parseInt(req.query.p) || 1;
	//检查用户是否存在
	User.get(req.params.name, function(err, user) {
		if(!user) {
			req.flash('error', '用户不存在!');
			return res.redirect('/');
		}
		//查询并返回该用户第 page 页的 10 篇文章
		Post.getTen(user.name, page, function(err, posts, total) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('user', {
				title: user.name,
				posts: posts,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * 10 + posts.length) == total,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
});
router.get('/u/:name/:day/:title', function(req, res) {
	Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
		if(err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('article', {
			title: req.params.title,
			post: post,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});
router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function(req, res) {
	var currentUser = req.session.user;
	Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
		if(err) {
			req.flash('error', err);
			return res.redirect('back');
		}
		res.render('edit', {
			title: '编辑',
			post: post,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});
router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function(req, res) {
	var currentUser = req.session.user;
	Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err) {
		var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
		if(err) {
			req.flash('error', err);
			return res.redirect(url); //出错！返回文章页
		}
		req.flash('success', '修改成功!');
		res.redirect(url); //成功！返回文章页
	});
});
router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function(req, res) {
	var currentUser = req.session.user;
	Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
		if(err) {
			req.flash('error', err);
			return res.redirect('back');
		}
		req.flash('success', '删除成功!');
		res.redirect('/');
		//  return res.redirect('/back');
	});
});
router.post('/u/:name/:day/:title', function(req, res) {
	var date = new Date(),
		time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
	var comment = {
		name: req.body.name,
		email: req.body.email,
		website: req.body.website,
		time: time,
		content: req.body.content
	};
	var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
	newComment.save(function(err) {
		if(err) {
			req.flash('error', err);
			return res.redirect('back');
		}
		req.flash('success', '留言成功!');
		res.redirect('back');
	});
});
router.get('/socket', function(req, res) {
	res.render('socket', {
		title: 'Welcome Realtime Server',
	});
});

router.get('/archive', function(req, res) {
	Post.getArchive(function(err, posts) {
		if(err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('archive', {
			title: '存档',
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

router.get('/tags', function (req, res) {
  Post.getTags(function (err, posts) {
    if (err) {
      req.flash('error', err); 
      return res.redirect('/');
    }
    res.render('tags', {
      title: '标签',
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

router.get('/tags/:tag', function (req, res) {
  Post.getTag(req.params.tag, function (err, posts) {
    if (err) {
      req.flash('error',err); 
      return res.redirect('/');
    }
    res.render('tag', {
      title: req.params.tag,
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

router.get('/search', function (req, res) {
  Post.search(req.query.keyword, function (err, posts) {
    if (err) {
      req.flash('error', err); 
      return res.redirect('/');
    }
    res.render('search', {
      title: "SEARCH:" + req.query.keyword,
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
function checkLogin(req, res, next) {
	if(!req.session.user) {
		req.flash('error', '未登录!');
		res.redirect('/admin/login');
	}
	next();
}

function checkNotLogin(req, res, next) {
	if(req.session.user) {
		req.flash('error', '已登录!');
		res.redirect('back');
	}
	next();
}

module.exports = router;
