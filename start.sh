killall sass
sass --debug-info --watch ./sass:./public/css &
NODE_ENV=development node ../node-daemon/d.js app.js
