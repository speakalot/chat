/// -----------------------------------------------------------------------------------------------------------
//	roomLIB -> Arquivo com as funções e rotinas gerais ligadas as salas
/// -----------------------------------------------------------------------------------------------------------
var rooms = {};
var room = {};
var users = {};
/// -----------------------------------------------------------------------------------------------------------
// Métodos que irão ficar públicos no escopo da aplicação quando houver o include deste arquivo.
module.exports = {
	// --------------------------------------------------------------------------------------------------------
	// Verifica se a sala existe e retorna a sala se ela existir
	// --------------------------------------------------------------------------------------------------------
	CheckIfRoomExists: function CheckIfRoomExists(roomId) {
		return rooms[roomId];
	}, 
	// --------------------------------------------------------------------------------------------------------	
	// Cria uma nova sala e retorna a sala criada
	// --------------------------------------------------------------------------------------------------------	
	CreateRoom: function CreateRoom(roomId){
		var room = {
			id : roomId,
			users : {}
		}
		rooms[room.id] = room;
		return rooms[room.id];
	}, 
	// --------------------------------------------------------------------------------------------------------	
	// Deleta uma sala
	// --------------------------------------------------------------------------------------------------------	
	DeleteRoom: function DeleteRoom(roomId){
		if (CheckIfRoomExists(roomId)) {
            delete rooms[room[roomId]];
		}
	},
	// --------------------------------------------------------------------------------------------------------
	// Insere o usuário em uma sala determinada
	// --------------------------------------------------------------------------------------------------------	
	InsertRoomUser: function InsertRoomUser(room, user){
		room.users[user.userid] = user;
	},
	// --------------------------------------------------------------------------------------------------------	
	// Busca os usuários de uma sala determinada
	// --------------------------------------------------------------------------------------------------------
	GetRoomUsers: function GetRoomUsers(roomId) {
        if (rooms[roomId]) {
            return rooms[roomId].users;
        }
        return null;
	},
	// --------------------------------------------------------------------------------------------------------	
	// Deleta um usuário de uma sala determinada
	// --------------------------------------------------------------------------------------------------------
	DeleteRoomUser: function DeleteRoomUser(roomId, userid){
        delete rooms[roomId].users[userid];
	}, 
	// --------------------------------------------------------------------------------------------------------
	// Retorna a quantidade de salas existentes
	// --------------------------------------------------------------------------------------------------------
	GetRoomsCount: function GetRoomsCount() {
		return Object.keys(rooms).length
	}, 
	// --------------------------------------------------------------------------------------------------------
	// Retorna as salas e a quantidade de usuários em cada sala
	// --------------------------------------------------------------------------------------------------------
	GetRoomsUserCount: function GetRoomsUserCount(){
		var roomx = [];
		for (x=0; x < Object.keys(rooms).length; x++) {
			var id = Object.keys(rooms)[x];
			var qtd = Object.keys(rooms[id].users).length;
			roomx[x] = {id:id, qtd:qtd};
		}
		return roomx;
	}
};


