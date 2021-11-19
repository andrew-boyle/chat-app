const socket = io()

// DOM (using $ prefix as convention for DOM elements)
const $chatForm = document.querySelector('#chatForm')
const $chatMessage = document.querySelector('#chatbox')
const $chatSubmitBtn = document.querySelector('#chatSubmit')
const $locationBtn = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options - using qs to parse out options passed in form.
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// Autoscrolling
const autoscroll = () => {
   // New message element
   const $newMessage = $messages.lastElementChild
   // Height of new message
   const newMessageStyles = getComputedStyle($newMessage)
   const newMessageMargin = parseInt(newMessageStyles.marginBottom)
   const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

   // visible height for messages
   const visibleHeight = $messages.offsetHeight

   // Total height of all messages (even offscreen)
   const containerHeight = $messages.scrollHeight

   // How far has the user scrolled? (number represents the bottom of the visible screen)
   const scrollOffset = $messages.scrollTop + visibleHeight

   // if at bottom of list before new one was added, then auto-scroll.
   if (containerHeight - newMessageHeight <= scrollOffset) {
      // scroll to bottom.
      $messages.scrollTop = $messages.scrollHeight
   }

}


// recieve message from client - render html via template
socket.on('message', (message) => {
   const html = Mustache.render(messageTemplate, {
      username: message.username,
      message: message.text,
      createdAt: moment(message.createdAt).format('h:mm:ssa')
   })
   $messages.insertAdjacentHTML('beforeend', html)
   autoscroll()
})

// recieve location message from client
socket.on('locationMessage', (location) => {
   const html = Mustache.render(locationTemplate, {
      username: location.username,
      location: location.url,
      createdAt: moment(location.createdAt).format('h:mm:ssa')
   })
   $messages.insertAdjacentHTML('beforeend', html)
   autoscroll()
})

// receive room data
socket.on('roomData', ({room, users}) => {
   const html = Mustache.render(sidebarTemplate, {
      room,
      users
   })
   $sidebar.innerHTML = html
})

// event listener for submit
$chatForm.addEventListener('submit', (e) => {
   e.preventDefault()

   $chatSubmitBtn.setAttribute('disabled', 'disabled')

   socket.emit('sendMessage', $chatMessage.value, (err) => {
      $chatSubmitBtn.removeAttribute('disabled')
      $chatMessage.value = ''
      $chatMessage.focus()

      if (err) {
         return console.log(err);
      }
      console.log('Message delivered');
   })

})

// event listener for location button
$locationBtn.addEventListener('click', (e) => {
   if (!navigator.geolocation) {
      return alert('Geolocation is not support by this browser')
   }

   $locationBtn.setAttribute('disabled', 'disabled')
   
   navigator.geolocation.getCurrentPosition((position) => {
      const locCoords = {latitude: position.coords.latitude, longitude: position.coords.longitude}
      socket.emit('sendLocation', locCoords,
         (ack) => {
            $locationBtn.removeAttribute('disabled')
            if (ack) {
               return console.log(ack);
            }
            console.log('Location not shared');
      })
   })

   e.preventDefault()

} )

socket.emit('join', {username, room}, (error) => {
   if (error) {
      alert(error)
      location.href = '/'
   }
})
