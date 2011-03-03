var Ni = require('ni');


Ni.config('root', __dirname);

// redis
Ni.config('redis_host', '127.0.0.1');
Ni.config('redis_port', '6385');
Ni.config('redis_general_db', 1);
Ni.config('redis_session_db', 2);
Ni.config('redis_nohm_db', 3);

// cookies
Ni.config('cookie_key', 'etourney-dev');
Ni.config('cookie_secret', 'ASHUAoant3uiTNtn28');
