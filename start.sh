killall sass
sass --debug-info --watch public/css/default/style.scss &
NODE_ENV=development node ../node-daemon/d.js app.js
