const Koa = require('koa');
const site = require('koa-static')
const cors = require('@koa/cors');
const { userJoin, getRoomUsers, getCurrentUser, userLeave } = require('./utils/User');
const formatMessage = require('./utils/Message')

const app = new Koa()
const server = require('http').createServer(app.callback());
const io = require('socket.io')(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});
app.use(site('client/build'))
app.use(cors())
const GM = 'GM'
io.on('connection', (socket) => {
    //user enter room
    socket.on('joinRoom', ({ username, room }) => {
        // update users in the room
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)
        // welcome user
        // socket.emit('message', formatMessage(GM, `欢迎[${socket.id}]`))
        // notify every others. player is entering the room
        // socket.broadcast.to(user.room).emit('message', formatMessage(GM, `[${socket.id}]进入房间`))
        //update room info and user list
        io.to(user.room).emit('roomUsers', { room: user.room, users: getRoomUsers(user.room) })
    })
    // player send message; replay to everyone in the room
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message', formatMessage(user.username, msg, user.id))
    })
    // disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)
        if (user) {
            // io.to(user.room).emit('message', formatMessage(GM, `[${user.id}] 离开房间`))
            io.to(user.room).emit('roomUsers', { room: user.room, users: getRoomUsers(user.room) })
        }
    })
})
server.listen(3001)