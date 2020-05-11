var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var users = [];
var user_id_map = [];
var connections = [];

var name;
app.get('/', function(req, res){
	res.sendFile(__dirname + '/main.html');
});

io.sockets.on('connection', function(socket){
	connections.push(socket);
	console.log("Connected: %s sockets connected", connections.length);

	/* When a user disconnects from the chat */
	socket.on('disconnect', function(data){

		io.sockets.emit('delete user', {per: socket.username});
		users.splice(users.indexOf(socket.username), 1);

		updateUsernames();

		for(var i=0;i<user_id_map.length;i++)
		{
			if(user_id_map[i][0] == socket.username)
			{
				user_id_map.splice(i,1);
				break;
			}
    	}

		connections.splice(connections.indexOf(socket), 1);

		console.log("Disconnected: %s sockets connected", connections.length);		
	});

	/* Sending a message */
	socket.on('send message', function(data){
		console.log(data);

		//this array contains all words in message starting with @
		var words_starting_with_at = [];
		var valid_names_with_at = [];
		var ids_of_at_names = [];
		var words = data.split(" ");
		for(var i in words) 
		{
			if(words[i].charAt(0) == '@')
			{
				var string_with_at = words[i].substr(1);
    			words_starting_with_at.push(string_with_at);
    		}
		}
		console.log("at: " + user_id_map);
		for(var i in words_starting_with_at)
		{
			user_name = words_starting_with_at[i];
			for(var j in user_id_map)
			{
				if(user_id_map[j][0] == user_name)
				{
					console.log("hwww");
					valid_names_with_at.push(user_name);
					ids_of_at_names.push(user_id_map[j][1]);
					break;
				}
			}
		}

		if(ids_of_at_names.length > 0)
		{
			console.log("Sending message to:  " +  valid_names_with_at);
			for(var i in ids_of_at_names)
			{
				var user_id = ids_of_at_names[i];
				io.sockets.in(user_id).emit('new message', {msg:data, user: socket.username});
			}
		}
		else
		{
			console.log("Broadcast message to all, no specific usernames with @")
			console.log('username: ' + socket.username);
			io.sockets.emit('new message', {msg:data, user: socket.username});
		}
		
		//var clients = io.sockets.clients();
		//console.log(clients);
		//io.sockets.in(socket.id).emit('new message', {msg:data, user: socket.username});
	});

	/* New User */
	socket.on('new user', function(data, callback)
	{
		callback(true);
		console.log(data);
	    // console.log(data +" : has joined the chat ");

		socket.username = data;
		users.push(data);
		user_id_map.push([data,socket.id]);
		//console.log("update: " + user_id);

		updateUsernames();
		joinUser(data);
		// name = data;
		// console.log('a');
	});

	function updateUsernames(){
		io.sockets.emit('get_users', users);
	}

	function joinUser(data){
		io.sockets.emit('new person', {name: data});
	}
});

server.listen(3000);
console.log('Server Running on localhost:3000'); 