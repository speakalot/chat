/// -----------------------------------------------------------------------------------------------------------
//	authLIB -> Arquivo com as funções e rotinas gerais de autenticação
/// -----------------------------------------------------------------------------------------------------------
var objCoreLib		= require('./coreLib.js');
var objSocketLib	= require('./socketLib.js');
var clientInfo		= "";
/// -----------------------------------------------------------------------------------------------------------
// Métodos que irão ficar públicos no escopo da aplicação quando houver o include deste arquivo.
module.exports = {
	// --------------------------------------------------------------------------------------------------------
	// Rotina de autenticação do usuario (Retorna true se autenticar ou erro)
	// --------------------------------------------------------------------------------------------------------
	auth: function (io) {
		require('socketio-auth')(io, {
			authenticate: function (data, callback) {
				if (data) {
					var password = data.password;
					if (password === 'ABC') {
						console.log('Usuario autenticou!');
						return callback(true, true);
					} else {
						return callback(new Error("User not found"));
					}
				}
			},
			// -------------------------------------------------------------------------------------------------
			// Rotina pós autenticação
			// -------------------------------------------------------------------------------------------------
			postAuthenticate: function postAuthenticate(socket, data) {
				socket.auth = true;
				console.log('Usuario conectou!');
				if (objSocketLib.admSocket()) {
					clientInfo = socket.client.conn.remoteAddress;				
					io.to(objSocketLib.admSocket()).emit('info', String("Usuário " + data.username + " conectou com o IP: " + clientInfo).toString("utf8"));
				}
				objCoreLib.InitiateChat(socket, data, io);
			}
		});
	}
}