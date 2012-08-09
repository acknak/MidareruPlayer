MidareruPlayer
======================
.ogg player of javascript

directory (sample)
------
midareru_player  
├music  
│├1.ogg  
│├2.ogg  
│├3.ogg  
│├4.ogg  
│├5.ogg  
│├6.ogg  
│├7.ogg  
│└...  
├index.html  
├jukebox.js  
└utf8.js

usage
------
    // index.html
    ...
    jukebox = new Jukebox({baseElementId:"midareru_player",numMusic:100,strMusicL:"./music/"});]
    ...


required
------
* modern browser supporting native .ogg playing
* [utf8.js](http://202.248.69.143/~goma/js/utf.html)

license
----------
Copyright &copy; 2012 acknak

MidareruPlayer is released under the [BSD 3-Clause License](http://opensource.org/licenses/BSD-3-Clause)
