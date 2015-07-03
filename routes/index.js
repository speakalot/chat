var express		= require('express');
var router		= express.Router();
var path		= require('path');
var bodyParser	= require('body-parser');

router.use(bodyParser.urlencoded({ extended: false }));

/* GET home page. */
router.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, '../views', 'index.html'));
});

/* Acesso ao monitoramento via POST */
router.post('/monitor', function (req, res) {
	if (req) {
		var login = req.body.login;
		var pass = req.body.pass;
		if(login=='admwebaula' && pass=='wachatadmin'){
			res.sendFile(path.join(__dirname, '../views', 'monitor.html'));
		} else {
			res.sendFile(path.join(__dirname, '../views', 'error.html'));
		}
	}
});

router.get('/fileupload', function (req, res) {
	res.sendFile(path.join(__dirname, '../views', 'fupload.html'));
});

module.exports = router;