/// -----------------------------------------------------------------------------------------------------------
//	userLIB -> Arquivo com as funções e rotinas ligadas aos usuarios
/// -----------------------------------------------------------------------------------------------------------
var users = {};
/// -----------------------------------------------------------------------------------------------------------
// Métodos que irão ficar públicos no escopo da aplicação quando houver o include deste arquivo.
/// -----------------------------------------------------------------------------------------------------------
module.exports = {
	// --------------------------------------------------------------------------------------------------------
	// Deleta um usuário da lista geral de usuários
	// --------------------------------------------------------------------------------------------------------
	DeleteUserFromList: function DeleteUserFromList(userId) {
		delete users[userId];
	},
	// --------------------------------------------------------------------------------------------------------
	// Adiciona um usuário na lista geral
	// --------------------------------------------------------------------------------------------------------
	AddUserToList: function AddUserToList(user, socketId){
        users[user.userid] = user;
		users[user.userid].socketId = [socketId];
        return users[user.userid];
	}, 
	// --------------------------------------------------------------------------------------------------------
	// Procura um usuário na lista geral e o retorna quando encontrado.
	// --------------------------------------------------------------------------------------------------------
	FindUser: function FindUser(userId){		
		return users[userId];
	},
	// --------------------------------------------------------------------------------------------------------
	// Retorna a lista de usuários
	// --------------------------------------------------------------------------------------------------------
	GetUsersList: function GetUsersList(){
		return users;
	},
	// --------------------------------------------------------------------------------------------------------
	// Retorna a quantidade de usuários online
	// --------------------------------------------------------------------------------------------------------
	GetUsersOnlineCount: function GetUsersOnlineCount(){
		return Object.keys(users).length
	},
	// --------------------------------------------------------------------------------------------------------
	// Atualiza a lista de sockets de um usuário (Mais de uma conexão do mesmo usuário)
	// --------------------------------------------------------------------------------------------------------
	UpdateSocketList: function UpdateSocketList(user, socketArr) {
		users[user].socketId = [];
		for (x in socketArr) {
			users[user].socketId.push(socketArr[x]);
		}
	}
};