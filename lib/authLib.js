/// -----------------------------------------------------------------------------------------------------------
//	authLIB -> Arquivo com as funções e rotinas gerais de autenticação
/// -----------------------------------------------------------------------------------------------------------
var objCoreLib		= require('./coreLib.js');
var objSocketLib	= require('./socketLib.js');
var clientInfo		= "";
var ipvX			= require('ipv6');
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
					//
					var ipv6 = ipvX.v6;
					var ipv4 = ipvX.v4;
					var addressV4 = new ipv4.Address(socket.client.conn.remoteAddress);
					var addressV6 = new ipv6.Address(socket.client.conn.remoteAddress);

					if (addressV4.isValid()) {
						clientInfo = addressv4.address;
					} else {
						clientInfo = addressV6;
						if(addressV6.isTeredo()){
							clientInfo = clientInfo.teredo();
							clientInfo = clientInfo.client4;
						} else if (addressV6.address.indexOf('::ffff:') != -1) {
							clientInfo = addressV6.address.split('::ffff:')[1]
						}
						
					}
					
					io.to(objSocketLib.admSocket()).emit('info', String("Usuário " + data.username + " conectou com o IP: " + clientInfo).toString("utf8"));
				}
				objCoreLib.InitiateChat(socket, data, io);
			}
		});
	}
}