

var express = require('express');
var http = require('http');
var path = require('path');
var async = require('async');
var socketio = require('socket.io');

/*
I'm not a world-class node expert, so most of the above was different 
and I settled on using the setup that cloud9 offered as default.

Express is the content delivery system, http is used for the actual
request handling, socketio will be our websockets, path is for letting 
express route subdirectories to subdirectories it isn't needed here but it is 
useful all the same.  I'm not using async...
*/

/*These get the server going although it doesn't yet have a port 
to listen to.  That part is at the bottom.*/
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

/* This is a slick line, it tells our express instance to 
serve static content from the public folder and to resolve 
path names rather than be complicated.  So a GET request to / will 
get index.html out of the public directory.  A GET request to 
/folder1 would try or folder1's index file. */
router.use(express.static(path.resolve(__dirname, 'public')));

/*
  socketio works on events and callbacks, as does most node code.
  The "connection" event is sent from a client to the server when 
  they first connect.  The callback function is then fired and passed
  a handler for the socket they share.
*/
var namespace = "/";

var messages = [];
//array holding all the sockets
var sockets = [];
var outstandingChallenges = [];
var challengeRooms = [];
var challengeRoomNames = [];
var serverName = "Server: ";
var userChallenged = "";
var challenges = makeStruct("challenger challengee");
var challengeChangeType = 0; //0 is reject, 1 is accept
var successfulUpdate = -1; //if -1, it failed. If not -1, its the room number

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });
    sockets.push(socket);
    
    var serverMessage = function(){
      broadcast('message', 'This is a command, not a user message');
    
    };

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');
      
      if (!text)
      return;
      //# is a command, so we make sure it's just a regular message
      if(!/#/.test(text)){
        socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };
        broadcast('message', data);
        messages.push(data);
      });
      
      }
      else{
        socket.get('name', function (err, name) {
          if(/#challenge/.test(text))
          {
            userChallenged = text.split(" ");
            //We don't need the #challenge, just the name put in. Spaces will be removed.
            var data = {
              name: serverName,
              text: name + " challenges " + userChallenged[1] + " to the field of honor!"
            };
            broadcast('message', data);
            messages.push(data);
            outstandingChallenges.push(new challenges(name, userChallenged[1]));
            
            
            updateChallenges();
            
            //Tell socket to join a room, name is the challenger, userChallenged[1] is challengee
            //challengeRooms.push(name + " " + userChallenged[1]);
            //socket.join(name + " " + userChallenged[1]);
            challengeRooms.push(socket.join(name + " " + userChallenged[1]));
            challengeRoomNames.push(name + " " + userChallenged[1]);
            //Hardcoded for checking values, remove/comment out later
            /*
            var data = {
              name: serverName,
              text: "joining room " + challengeRoomNames[0]
            };
            socket.to(challengeRoomNames[0]).emit('message', data);
            */
          }
          //if name is in challenge list, takes first outstanding challenge
          //person giving the challenge must be in the list
          else if(/#accept/.test(text))
          {
            //notification would be here, but we need more info
            
            challengeChangeType = 1;
            var success = alterChallenge(name, socket);
            updateChallenges();
            
            //io.sockets.clients(challengeRoomNames[0]);
            if(success != -1)
            {
              var data = {
                name: serverName,
                text: "joining room " + challengeRoomNames[success]
              };
              
              io.sockets.in(challengeRooms[success]).emit('message', data);
              //should be the exact same statement as name + " " + userChallenged[1] in challengeRoomNames
              //socket.to(challengeRoomNames[0]).emit('message', data);
              //handle the fighting, then splice both room and room name
              
              //io.sockets.in(challengeRooms[success]).emit('fighting');
            }
          }
          else if(/#reject/.test(text))
          {
            var data = {
              name: serverName,
              text: name + " cowers away from the challenge..."
            };
            broadcast('message', data);
            messages.push(data);
            
            challengeChangeType = 0;
            var success = alterChallenge(name, socket);
            updateChallenges();
            
            
          }
          else
          {
            var data = {
            name: serverName,
            text: "Invalid command."
          };
          broadcast('message', data);
          messages.push(data);
          }
        });
      };


    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });
//Look for the first instance of a challenge with their name on challengee, remove it. Uses splice.
function alterChallenge(challenged, socket)
{
  var found = 0;
  for (var i = 0; i < outstandingChallenges.length; i++) 
  {
    
    if (outstandingChallenges[i].challengee == challenged)
    {
      //we still want to remove the challenge even if it's an accept
      //send out the challenges
      if (challengeChangeType == 1)
      {
        var data = {
          name: serverName,
          text: outstandingChallenges[i].challengee + " accepts the challenge from " + outstandingChallenges[i].challenger + "! Prepare to fight!"
        };
        broadcast('message', data);
        messages.push(data);
        
        socket.join(challengeRooms[i]);
        //broadcast that the two are now fighting
        

      }
      //remove the challenge from the list
      outstandingChallenges.splice(i, 1);
      //may remove from the list here, or not
      if(challengeChangeType == 0)
      {
        challengeRooms.splice(i, 1);
        challengeRoomNames.splice(i, 1);
      }
      
      found = 1;
      updateChallenges();
      return successfulUpdate = i;
      //break;
    }
  }
  //This line only runs if no challenges meeting our criteria are found
  if(found == 0)
  {
    var data = {
              name: serverName,
              text: "But there was no challenge! Maybe someone should send one!"
    };
    broadcast('message', data);
    messages.push(data);
  }
  return successfulUpdate = -1;
}

//This makes structs of as many arguments as you want, reuse it forever
function makeStruct(names) {
  var names = names.split(' ');
  var count = names.length;
  function constructor() {
    for (var i = 0; i < count; i++) {
      this[names[i]] = arguments[i];
    }
  }
  return constructor;
}

function updateChallenges() {
    broadcast('challenges', outstandingChallenges);

}

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

//this is where we actually turn to the outside world.  You'll need 
//to adjust if you are on some other server.
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});