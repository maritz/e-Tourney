killall sass
/home/maritz/.gem/ruby/1.9.1/bin/sass --debug-info --watch public/css/default/style.scss > log/sass.log &
NODE_ENV=development node app.js &
