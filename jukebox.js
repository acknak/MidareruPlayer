var Jukebox = function(_options){
	// private members
	var self = this;
	var options = {
		baseElementId: "",
		numMusic: 0,
		numPreLoad: 1,
                volume: 0.5,
		strMusicL: "./music/",
		strMusicR: ".ogg",
		strTags: ["title","artist","album"]
	};
	var base;
	var selectedDisk = null;
	var selectedIds = [];
	var isLoop = false;
	var numDisk = 0;
        var volume = 0;

	// private methods
	var makeDisk = function(){
		var newDisk = new Disk(self,getNewId());
		var tmpDisk = selectedDisk;
		if(tmpDisk){
			while(tmpDisk.getNext()!==null){
				tmpDisk = tmpDisk.getNext();
			}
			tmpDisk.setNext(newDisk);
		}else{
			selectedDisk = newDisk;
		}
		newDisk.load();
                newDisk.setVolume(volume);
	};
	var getNewId = function(){
		var tmpId, isContinue;
		if(selectedIds.length == options.numMusic){
			selectedIds = [];
		}
		do{
			isContinue = false;
			tmpId = Math.floor(Math.random()*options.numMusic)+1;
			for(var i=0; i<selectedIds.length; i++){
				if(selectedIds[i] == tmpId){
					isContinue = true;
					break;
				}
			}
		}while(isContinue);
		selectedIds[selectedIds.length] = tmpId;
		return tmpId;
	};
	var shiftTags = function(){
		for(var i=0; i<numDisk; i++){
			document.getElementById("time"+i).textContent = document.getElementById("time"+(i+1)).textContent;
		}
		for(var j=0; j<options.strTags.length; j++){
			for(var i=0; i<numDisk; i++){
				if(document.getElementById(options.strTags[j]+i).firstChild){
					document.getElementById(options.strTags[j]+i).replaceChild(document.getElementById(options.strTags[j]+(i+1)).firstChild, document.getElementById(options.strTags[j]+i).firstChild);
				}else{
					document.getElementById(options.strTags[j]+i).appendChild(document.getElementById(options.strTags[j]+(i+1)).firstChild);
				}
			}
		}
		for(var j=0; j<options.strTags.length; j++){
			if(document.getElementById(options.strTags[j]+numDisk).firstChild){
				document.getElementById(options.strTags[j]+numDisk).removeChild(document.getElementById(options.strTags[j]+numDisk));
			}else{
				document.getElementById(options.strTags[j]+numDisk).textContent = "";
			}
		}
		document.getElementById("time"+numDisk).textContent = "";
		document.getElementById("title"+numDisk).textContent = "よみこみちう...";
	};

	// public methods
	this.play = function(){
		if(!self.isPlaying()){
			selectedDisk.play();
		}
	};
	this.pause = function(){
		if(self.isPlaying()){
			selectedDisk.pause();
			selectedDisk.isPlaying(false);
		}
	};
	this.stop = function(){
		selectedDisk.stop();
	};
	this.skip = function(){
		var _selectedDisk = selectedDisk;
		selectedDisk = _selectedDisk.getNext();
		_selectedDisk.stop();
		selectedDisk.play();
		delete _selectedDisk;
		shiftTags();
		makeDisk();
	};
 	this.setVolume = function(vol){
		volume = vol;
		if (typeof(vol) !== "number"){
			return;
		}
		vol = (vol>1)?1:((vol<0)?0:vol);
		var tmpDisk = selectedDisk;
		if(tmpDisk){
			do{
				tmpDisk.setVolume(vol);
			}while((tmpDisk=tmpDisk.getNext())!==null)
		}
      	};
	this.isPlaying = function(){
		return selectedDisk.isPlaying();
	};
	this.isLoop = function(_isLoop){
		if(typeof(_isLoop)==="boolean"){
			isLoop = _isLoop;
		}else{
			return isLoop;
		}
	};
	this.updateTag = function(_id, _key, _val){
		var numChange=null, tmpDisk=selectedDisk, canChange=false;
		if(typeof(_key)==="string" && (typeof(_val)==="string"||typeof(_val)==="number")){
			if(_key === "time"){
				canChange = true;
			}else{
				for(var i=0; i<options.strTags.length; i++){
					if(options.strTags[i] == _key){
						canChange = true;
						break;
					}
				}
			}
			if(canChange){
				if(tmpDisk==null || _id==tmpDisk.getId()){
					numChange = 1;
				}else{
					for(var i=1; i<numDisk; i++){
						tmpDisk = tmpDisk.getNext();
						if(_id == tmpDisk.getId()){
							numChange = i+1;
							break;
						}
					}
				}
				if(numChange!=null){
					if(_key==="title"){
						var aTag = document.createElement("a");
						aTag.setAttribute("target","_blank");
						aTag.setAttribute("href",options.strMusicL+_id+options.strMusicR);
						aTag.textContent = _val;
						document.getElementById(_key+numChange).textContent = "";
						document.getElementById(_key+numChange).appendChild(aTag);
					}else{
						document.getElementById(_key+numChange).textContent = _val;
					}
				}
			}
		}
	};
	this.getOptions = function(){
		return options;
	};

	//constructor
	(function(){
		if(typeof(_options)==="object"){
			for(var key in _options){
				if(typeof(options[key])===typeof(_options[key])){
					options[key] = _options[key];
				}
			}
		}
		base = document.getElementById(options.baseElementId);
		numDisk = options.numPreLoad+1;
                volume = (options.volume>1)?1:((options.volume<0)?0:options.volume);
		for(i=0;i<numDisk;i++){
			makeDisk();
		}
		selectedDisk.play();
	})();
};

var Disk = function(_jukebox,_id){
	// private members
	var jukebox = _jukebox;
	var id = _id;
	var options = {};
	var objPlayers = [];
	var nextDisk = null;

	// private methods
	var numObj = new function(){
		var selector = 0;
		return {
			now: function(){return selector%objPlayers.length},
			next: function(){return (selector+1)%objPlayers.length},
			_next: function(){return (++selector)%objPlayers.length}
		};
	};
	var loadPartialData = function(url){
		var req = new XMLHttpRequest();
		req.overrideMimeType('text/plain; charset=x-user-defined');
		req.open('GET',url,false);
		req.setRequestHeader("Range", "bytes=0-1023");
		req.send(null);
		if (req.status != 206) return '';
		return req.responseText;
	};

	// public methods
	this.play = function(){
		objPlayers[numObj.now()].play();
		if(objPlayers[numObj.next()].currentTime != 0){
			objPlayers[numObj.next()].currentTime = 0;
		}
	};
	this.pause = function(){
		var currentTime = objPlayers[numObj.now()].currentTime;
		objPlayers[numObj.now()].currentTime = 0;
		objPlayers[numObj.now()].pause();
		objPlayers[numObj._next()].currentTime = currentTime;
	};
	this.stop = function(){
		objPlayers[numObj.now()].currentTime = 0;
		objPlayers[numObj.now()].pause();
	};
	this.isPlaying = function(){
		var isPlaying = false;
		for(var i=0; i<objPlayers.length; i++){
			if(!objPlayers[i].paused){
				isPlaying = true;
			}
		}
		return isPlaying;
	};
	this.setNext = function(_nextDisk){
		nextDisk = _nextDisk;
	};
 	this.getNext = function(){
		return nextDisk;
	};
 	this.setVolume = function(vol){
		if (typeof(vol) !== "number"){
			return;
		}
		vol = (vol>1)?1:((vol<0)?0:vol);
		for(var i=0; i<objPlayers.length; i++){
			objPlayers[i].volume = vol;
		}
      	};
	this.getId = function(){
		return id;
	};
	this.load = function(){
		var src = options.strMusicL + id + options.strMusicR;
		for(var i=0; i<objPlayers.length; i++){
			objPlayers[i].src = src;
			objPlayers[i].load();
		}
		var filestream = loadPartialData(src);
		var bytes = [];
		for(var i=0; i<filestream.length; i++){
			bytes[i] = filestream.charCodeAt(i) & 0xff;
		}
		for(var i=0; i<options.strTags.length; i++){
			var pTag = 0;
			var tag = "";
			if((pTag = filestream.indexOf(options.strTags[i]))>0){
				pTag += options.strTags[i].length+1;
				while(bytes[++pTag]!==0){
					tag += "%"+(bytes[pTag-1].toString(16));
				}
				jukebox.updateTag(id, options.strTags[i], utf.URLdecode(tag));
			}
		}
	};

	//constructor
	(function(){
		options = jukebox.getOptions();
		for(var i=0; i<2; i++){
			objPlayers[i] = document.createElement("audio");
			document.getElementById(options.baseElementId).appendChild(objPlayers[i]);
			objPlayers[i].addEventListener("ended", function(){
				if(jukebox.isLoop()){
					jukebox.stop();
					jukebox.play();
				}else{
					jukebox.skip()
				}
			}, false);
			objPlayers[i].addEventListener("durationchange", function(){
				jukebox.updateTag(id, "time", ""+Math.floor(this.duration/60)+":"+("0" +Math.floor(this.duration%60)).slice(-2));
			}, false);
		}
	})();
};
