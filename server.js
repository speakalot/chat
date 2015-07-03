/// -----------------------------------------------------------------------------------------------------------
///										SERVIDOR DE CHAT WEBAULA
/// -----------------------------------------------------------------------------------------------------------
var port			  = 8090;											// Porta do servidor
var express			  = require('express');								// Instancia do framework Express
var app				  = express();										// Inicialização do framework
var http			  = require('http').createServer(app);				// Instancia do protocolo HTTP
var util			  = require('util');								// Utilitário para coletar informações do servidor.
var v8memoryUsage	  = util.inspect(process.memoryUsage().rss);		// Quantidade de memória alocada para o serviço
var routes			  = require('./routes');							// Controle das rotas
var path              = require('path');								// Utilitario para path.join
var ExpressPeerServer = require('peer').ExpressPeerServer;
// -----------------------------------------------------------------------------------------------------------
// Inicia a escuta do servidor HTTP 
// -----------------------------------------------------------------------------------------------------------
http.listen(port, function () {
	console.log('Servidor rodando na porta: ' + port);
});
// -----------------------------------------------------------------------------------------------------------
// Configurações do servidor
// -----------------------------------------------------------------------------------------------------------
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.use('/', routes);
app.use(express.static(path.join(__dirname, 'public')));

var options = {
    debug: true
}
app.use('/p2p', ExpressPeerServer(http, options));

// -----------------------------------------------------------------------------------------------------------
// Seta o número de conexões para ilimitado
// -----------------------------------------------------------------------------------------------------------
http.setMaxListeners(0);
// -----------------------------------------------------------------------------------------------------------
// Instancia o serviço Socket.IO e passa o servidor HTTP para o IO usar-lo
// -----------------------------------------------------------------------------------------------------------
var chatServer = require('./lib/socketLib.js');
chatServer.listen(http);
// -----------------------------------------------------------------------------------------------------------
// Retorna a memória utilizada quando o servidor iniciou o serviço.
// -----------------------------------------------------------------------------------------------------------
exports.getSvStartMemory = function () {
	return v8memoryUsage;
};
