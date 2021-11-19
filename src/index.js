const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

// setup static directory (public)
// server automatically provides index.html in this location.
app.use(express.static(publicDirectoryPath));


io.on('connection', (socket) => {
   console.log('New Websocket connection')

   // listen for join
   socket.on('join', ({username, room}, acknowledge) => {
      const {error, user} = addUser({ id: socket.id, username, room })

      if (error) {
         return acknowledge(error)
      }

      socket.join(user.room)
      
      // emit message on connection to originator
      socket.emit('message', generateMessage(`Admin`, 'Welcome!'))
      // send to everyone except the originator in the specific room (.to)
      socket.broadcast.to(user.room).emit('message', generateMessage(`Admin`,`${user.username} has joined the room.`))
      // send to everyone the new list of users in the room.
      io.to(user.room).emit('roomData', {
         room: user.room,
         users: getUsersInRoom(user.room)
      })
      acknowledge()
   })

   // listen for send message
   socket.on('sendMessage', (chatMessage, acknowledge) => {
      const filter = new Filter()

      if(filter.isProfane(chatMessage)) {
         return acknowledge('Profanity detected. Double dumb-ass on you.')
      }

      // get user details
      const user = getUser(socket.id)

      // send out to all clients in same room
      io.to(user.room).emit('message', generateMessage(user.username, chatMessage))
      acknowledge()
   })

   // listen for send location message
   socket.on('sendLocation', (locCoords, acknowledge) => {
      const user = getUser(socket.id)
      
      io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://www.google.com/maps?q=${locCoords.latitude},${locCoords.longitude}`))
      return acknowledge('Location Shared.')
   })

   // on client disconnect...
   socket.on('disconnect', () => {
      const user = removeUser(socket.id)
       
      if (user) {
         io.to(user.room).emit('message', generateMessage(`Admin`, `${user.username} has left the room.`))
         io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
         })
      }
   })

})

server.listen(port, () => {
   console.log(`Server is up on port ${port}.`)
})