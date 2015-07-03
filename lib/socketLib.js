/// -----------------------------------------------------------------------------------------------------------
//	socketLIB -> Arquivo com as funcções e rotinas ligadas ao socket de comunicação entre cliente/servidor
/// -----------------------------------------------------------------------------------------------------------
var socketio		= require('socket.io');
var objUserLib		= require('./userLib.js');
var objRoomLib		= require('./roomLib.js');
var objAuthLib		= require('./authLib.js');
var objCoreLib		= require('./coreLib.js');
var ss				= require('socket.io-stream');
var path			= require('path');
var maxConnections	= 0;
var admSocket		= "";
var userName		= "";
var io;
var ioPingInterval	= 25000;
var readOpts		= { highWaterMark: Math.pow(2, 32)};
var writeOpts		= { highWaterMark: Math.pow(2, 32)};
var mime			= require('mime');								// Biblioteca de tipos de arquivo
// ------------------------------------------------------------------------------------------------------------
// Aqui o exports cria um evento (listen) que espera um servidor como parametro
// O socket.io precisa se conectar a um servidor e este servidor vem do server.js 
// ------------------------------------------------------------------------------------------------------------
exports.listen = function (server) {
	// recebe o servidor
	io = socketio.listen(server);
	// 
	io.engine.pingInterval = ioPingInterval;
	// Seta o maxListeners para ilimitado. (Quantidade de sockets conectados simultaneamente.)
	io.sockets.setMaxListeners(0);
	//
	if (io.version) {
		ss.forceBase64 = true;
	}
	// --------------------------------------------------------------------------------------------------------
	// Processo de autorização
	// --------------------------------------------------------------------------------------------------------
	objAuthLib.auth(io);
	// --------------------------------------------------------------------------------------------------------
	// Abertura do canal de comunicação via socket
	// --------------------------------------------------------------------------------------------------------
	io.sockets.on('connection', function (socket) {
		// Auto incremento do número de conexões que foram realizadas no servidor.
		maxConnections++;
		// ----------------------------------------------------------------------------------------------------
		// Quando o socket desconecta do servidor
		// ----------------------------------------------------------------------------------------------------
		socket.on('disconnect', function () {
			// Se é um socket de cliente (pode ser um socket que busca info do servidor)
			if (this.user) {
				// Verifica se o cliente tem mais de um socket, se tiver mais de um mata somente o socket
				// se tiver somente um tem que remover ele da lista de usuarios da sala e da lista geral
				// de usuários.
				if (this.user.socketId.length == 1) {
					// Inicia a rotina de limpeza para cada sala e atualiza os usuarios conectados na mesma
					// sala para que este cliente não seja mais visto por todos.
					for (x in this.user.rooms) {
						objRoomLib.DeleteRoomUser(this.user.rooms[x], this.user.userid)
						objCoreLib.UpdateContactList(io, objRoomLib.CheckIfRoomExists(this.user.rooms[x]));
					}
					// Avisa a quem estiver conversando com ele que o usuário desconectou.
					if (this.user.talkList.length > 0) {
						for (x in this.user.talkList) {
							var usrSocket = objUserLib.FindUser(this.user.talkList[x]);
							if (usrSocket) {
								for (x in usrSocket.socketId) {
									io.to(usrSocket.socketId[x]).emit('usrDisconnected', { msg: String("Usuário " + this.user.username + " desconectou.").toString("utf8"), userid: this.user.userid });
								}
							}
						}
					}
					// Avisa a quem estiver recebendo arquivo que o usuário desconectou.
					if (this.user.fileTransfer.length > 0) {
						for (x in this.user.fileTransfer) {
							var usrSocket = objUserLib.FindUser(this.user.fileTransfer[x]);
							if (usrSocket) {
								for (x in usrSocket.socketId) {
									io.to(usrSocket.socketId[x]).emit('stopTransfer', { userid: this.user.userid });
								}
							}
						}
					}
					// Deleta o usuario da lista geral
					objUserLib.DeleteUserFromList(this.user.userid);
					//
					io.to(admSocket).emit('info', String("Usuário " + this.user.username + " desconectou.").toString("utf8"));
					io.to(admSocket).emit('getServerInfo', objCoreLib.GetServerInfo());
				} else {
					// Delete o item do array NO SOCKET que guardava o id do socket
					delete this.user.socketId[this.user.socketId.indexOf(this.id)];
					// Delete o item do array NA LISTA DE USERS que guardava o id do socket
					objUserLib.UpdateSocketList(this.user.userid, this.user.socketId)
				}
			}
			// Mata o socket.
			this.disconnect();
			// Garbage Collector (limpeza de memória)
			global.gc();
		});
		// ----------------------------------------------------------------------------------------------------
		// Quando o socket envia uma mensagem é pesquisado quantos sockets o destinatário possui e envia 
		// para eles através do emite "receiveMessage"
		// ----------------------------------------------------------------------------------------------------
		socket.on('sendMessage', function (data, fn) {
			var usr = objUserLib.FindUser(data.userid);
			if (usr == undefined) {
				console.log('Mensagem não enviada, usuário offline');
				if (fn)
					fn(data);
			} else {
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('receiveMessage', { msg: data.msg, remetente: socket.user.userid, nick: socket.user.username, type: data.type });
					io.to(admSocket).emit('info', "mensagem enviada");
				}
				console.log('Mensagem enviada');
			}
		});
		// ----------------------------------------------------------------------------------------------------
		// Faz login de Admin e busca as informações do servidor emitindo um retorno com as informações coletadas.
		// ----------------------------------------------------------------------------------------------------
		socket.on('admLogin', function (data) {
			if (data.login == 'admwebaula' && data.pass == 'wachatadmin') {
				admSocket = this.id;
				socket.emit('getServerInfo', objCoreLib.GetServerInfo());
			}			;
		});
		// ----------------------------------------------------------------------------------------------------
		// Quando o remetente está digitando uma mensagem este evento avisa ao destinatário o acontecimento
		// ----------------------------------------------------------------------------------------------------
		socket.on('typing', function (data) {
			var usr = objUserLib.FindUser(data);
			if (usr)
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('typing', socket.user.userid);
				}
		});
		// ----------------------------------------------------------------------------------------------------
		// Quando o remetente para de digitar uma mensagem este evento avisa ao destinatário o acontecimento
		// ----------------------------------------------------------------------------------------------------
		socket.on('stopTyping', function (data) {
			var usr = objUserLib.FindUser(data);
			if (usr)
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('stopTyping', socket.user.userid);
				}
		});
		// ----------------------------------------------------------------------------------------------------
		// Quando começa uma conversa é registrado no array as partes da conversa, cada remetente recebe o ID 
		// do destinatário.
		// ----------------------------------------------------------------------------------------------------
		socket.on('startChatting', function (userid) {
			this.user.talkList.push(userid);
		});
		// ----------------------------------------------------------------------------------------------------
		// Quando termina (fecha a caixa de chat) uma conversa é removido do array o destinatário da conversa.
		// ----------------------------------------------------------------------------------------------------
		socket.on('endChatting', function (userid) {
			delete this.user.talkList[this.user.talkList.indexOf(userid)];
		});
		// ----------------------------------------------------------------------------------------------------
		// Quando termina (fecha a caixa de chat) uma conversa é removido do array o destinatário da conversa.
		// ----------------------------------------------------------------------------------------------------
		socket.on('acceptFile', function (data) {
			var usr = objUserLib.FindUser(data.usrSender);
			if (usr) {
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('startSendFile', data.usrReceive);
				}
			}
		});
		
		// ----------------------------------------------------------------------------------------------------
		// Quando é feita uma requisição de chamada de video data = { usrReceive}
		// ----------------------------------------------------------------------------------------------------
		socket.on('call', function (data, fn) {
			var usr = objUserLib.FindUser(data);
			if (usr == undefined) {
				console.log('Mensagem não enviada, usuário offline');
				if (fn)
					fn(data);
			} else {
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('callRequest', this.user.userid);
					io.to(admSocket).emit('info', "mensagem enviada");
				}
				console.log('Mensagem enviada');
			}
		});
		
		
		// ----------------------------------------------------------------------------------------------------
		// Quando é dado o aceite de uma requisição de chamada de video data = { usrReceive}
		// ----------------------------------------------------------------------------------------------------
		socket.on('acceptCall', function (data, fn) {
			var usr = objUserLib.FindUser(data);
			if (usr == undefined) {
				console.log('Mensagem não enviada, usuário offline');
				if (fn)
					fn(data);
			} else {
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('statusCall', { usrSender: this.user.userid, status: true });
					io.to(admSocket).emit('info', "mensagem enviada");
				}
				console.log('Mensagem enviada');
			}
		});
		
		// ----------------------------------------------------------------------------------------------------
		// Quando uma requisição de chamada de video é recusada data = { usrReceive}
		// ----------------------------------------------------------------------------------------------------
		socket.on('refuseCall', function (data, fn) {
			var usr = objUserLib.FindUser(data);
			if (usr == undefined) {
				console.log('Mensagem não enviada, usuário offline');
				if (fn)
					fn(data);
			} else {
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('statusCall', { usrSender: this.user.userid, status: false });
					io.to(admSocket).emit('info', "mensagem enviada");
				}
				console.log('Mensagem enviada');
			}
		});
		
		
		//
		socket.on('cancelFile', function (usrReceiver) {
			var usr = objUserLib.FindUser(usrReceiver);
			if (usr) {
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('cancelSendFile', this.user.userid);
				}
			}
		});
		//
		socket.on('fileTransferFinished', function (usrSender) {
			var usr = objUserLib.FindUser(usrSender);
			if (usr) {
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('fileTransferFinished', { msg: "Arquivo enviado com sucesso!", remetente: socket.user.userid, nick: socket.user.username });
				}
				delete this.user.fileTransfer[usrSender];
			}
		});
		//
		socket.on('fileTransferPercent', function (data) {//usrSender, percCompleted
			var usr = objUserLib.FindUser(data.sender);
			if (usr) {
				for (x in usr.socketId) {
					io.to(usr.socketId[x]).emit('fileTransferPercent', { receiver: socket.user.userid, percentual: data.percent });
				}
			}
		});
		// ----------------------------------------------------------------------------------------------------
		// TRANSFERENCIA DE ARQUIVO
		// ----------------------------------------------------------------------------------------------------
		ss(socket).on('sendFile', function (stream, data) {
			//ss.forceBase64 = true;
			try {
				var filename = path.basename(data.name);
				var filesize = data.filesize;
				var fileMime = mime.lookup(data.name)
				var newStream = ss.createStream(filename, writeOpts)
				data.sender = socket.user.userid;
				data.mimeType = fileMime;
				var usr = objUserLib.FindUser(data.userid);
				if (usr) {
					for (x in usr.socketId) {
						ss(io.sockets.connected[usr.socketId[x]]).emit('file', newStream, data)
						stream.pipe(newStream);
						socket.user.fileTransfer.push(data.userid);
					}
				}
			}
			catch (ex) {
				if (stream) {
					stream.end();
				}
				io.to(admSocket).emit('info', ex);
				console.log(ex);
			}
		});
	});
};
// ------------------------------------------------------------------------------------------------------------
// Variavel que armazena a quantidade de conexões que já foram realizadas no servidor
// ------------------------------------------------------------------------------------------------------------
exports.maxConnections = function () {
	return maxConnections;
};
// ------------------------------------------------------------------------------------------------------------
// Variavel que devolve o id do socket do admim.
// ------------------------------------------------------------------------------------------------------------
exports.admSocket = function () {
	return admSocket;
};