/// -----------------------------------------------------------------------------------------------------------
//	coreLIB -> Arquivo com as funções e rotinas gerais usadas por todo o sistema
/// -----------------------------------------------------------------------------------------------------------
var objUserLib	= require('./userLib.js');
var objRoomLib	= require('./roomLib.js');
var server		= require('../server.js');
var objSockLib	= require('./socketLib.js');
var util		= require('util');

var room, user;
// ------------------------------------------------------------------------------------------------------------
// Métodos que irão ficar públicos no escopo da aplicação quando houver o include deste arquivo.
// ------------------------------------------------------------------------------------------------------------
module.exports = {
	// --------------------------------------------------------------------------------------------------------
	// Quando o cliente conecta no servidor realiza as rotinas abaixo.
	// --------------------------------------------------------------------------------------------------------
	InitiateChat: function InitiateChat(socket, data, io){
		if(data.userid){
			// Verifica se o usuário já existe e se não existir adiciona ele nas listas
			user = objUserLib.FindUser(data.userid);
			if (!user) {
				// Adiciona o usuário na lista geral de usuários
				user = objUserLib.AddUserToList(data, socket.id);
				// Associa o socket ao usuário
				socket.user = user;
				// Lista de pessoas que ele estará conversando
				socket.user.talkList = [];
				// Lista de pessoas que está transferindo arquivos
				socket.user.fileTransfer = [];
				// Verifica se as salas do usuário já existem e as cria se for necessário.
				for (x in data.rooms) {
					room = objRoomLib.CheckIfRoomExists(data.rooms[x]);
					if (!room) {
						// Cria a sala quando ela não existe
						room = objRoomLib.CreateRoom(data.rooms[x]);
					}
					// Insere o usuario na sala
					objRoomLib.InsertRoomUser(room, socket.user);
					// Atualiza a lista de contatos.
					this.UpdateContactList(io, room)
				}
			} else {
				// Caso o usuario já esteja conectado... 
				// Insere um id do novo socket na lista de sockets do usuario
				user.socketId.push(socket.id);
				// Atualiza a instancia do usuário na lista geral
				objUserLib.UpdateSocketList(user.userid, user.socketId)
				// Atualiza a instancia do usuário no socket
				socket.user = user;
				// Atualiza a lista de contatos 
				// Como não entrou um novo cliente deve ser enviada a lista somente para a nova instancia
				// de socket que o usuario criou.
				for (x in data.rooms) {
					room = objRoomLib.CheckIfRoomExists(data.rooms[x]);
					// Atualiza a lista somente para o usuario do socket atual
					this.UpdateContactList(io, room, socket.id)
				}
			}
			io.to(objSockLib.admSocket()).emit('getServerInfo', this.GetServerInfo());
		}
	},
	// --------------------------------------------------------------------------------------------------------
	// Atualiza a lista de contatos. Quando um usuario entra em uma sala, é necessário re-enviar a lista
	// atualizada para todos os participantes da(s) sala(s) que o novo cliente está conectando. O mesmo ocorre
	// quando um cliente desconecta.
	// --------------------------------------------------------------------------------------------------------
	UpdateContactList: function UpdateContactList(io, objRoom, socketId){
		if (objRoom) {
			if (socketId) {
				io.to(socketId).emit('updateContactList', objRoom.users);
			}else{
				for (x in objRoom.users) {
					for(y in objRoom.users[x].socketId){
						io.to(objRoom.users[x].socketId[y]).emit('updateContactList', objRoom.users);
					}
				}
			}
		}
	},
	// --------------------------------------------------------------------------------------------------------
	// Entrega as informações do servidor
	// --------------------------------------------------------------------------------------------------------
	GetServerInfo: function GetServerInfo() {
		var userCollection = objUserLib.GetUsersList();
		userCollection = (userCollection == null ? [] : userCollection);
		var returnInfo			= {usersOnline: 0, roomQtd: 0, roomList: [], memoryUsed: 0, uptime: 0, userList: "", maxConnections: 0};
		var memoryForObjects	= (util.inspect(process.memoryUsage().rss) - server.getSvStartMemory()) / 1024 / 1024;
		for (x in userCollection) {
			if(userCollection[x].username){
				returnInfo.userList += "," + userCollection[x].username
			}
		}
		returnInfo.userList		= returnInfo.userList.substring(1).replace(/\,/g, '<br/>');
		returnInfo.memoryUsed	= memoryForObjects.toFixed(2) + " MB's.";
		returnInfo.uptime		= Math.floor(util.inspect(process.uptime()) / 60) + " minuto(s).";
		returnInfo.usersOnline	= objUserLib.GetUsersOnlineCount();
		returnInfo.roomQtd		= objRoomLib.GetRoomsCount();
		returnInfo.roomList		= objRoomLib.GetRoomsUserCount();
		returnInfo.maxConnections = objSockLib.maxConnections();
		return returnInfo;
	}
}
/// -----------------------------------------------------------------------------------------------------------