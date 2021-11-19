const users = []

const addUser = ({ id, username, room }) => {
   // Clean-normalize the data
   username = username.trim().toLowerCase()
   room = room.trim().toLowerCase()

   // validate user and room are provided.
   if (!room || !username) {
      return {
         error: 'Username and room are required.'
      }
   }

   // check for existing user
   const existingUser = users.find((user) => {
      return user.room === room && user.username === username
   })

   // validate username isn't already in use
   if (existingUser) {
      return {
         error: 'Username is already in use.'
      }
   }

   // Store user
   const user = { id, username, room}
   users.push(user)
   return {user}

}

const removeUser = (id) => {
   const index = users.findIndex((user) => user.id === id)

   if (index !== -1) {
      // remove that object from the array.
      return users.splice(index, 1)[0]
   }
}

const getUser = (id) => {
   const foundUser = users.find((user) => user.id === id)
   return foundUser
}

const getUsersInRoom = (room) => {
   const usersInRoom = users.filter((user) => user.room === room)
   return usersInRoom
}

module.exports= {
   addUser,
   removeUser,
   getUser,
   getUsersInRoom
}